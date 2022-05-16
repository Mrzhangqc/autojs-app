var AlertMain = function () {
  var eventer = events.emitter(threads.currentThread());

  var thread = threads.start(function() {
    auto.waitFor();

    var Maid = require("./Maid.js");
    var maid = new Maid('com.nyw.newnyw');
    var Unlock = require("./Unlock.js");
    var unlock = new Unlock();
    var Bell = require("./Bell.js");

    var space = 16 * 60 * 60 * 1000; // 16个小时监控
    var startDate = Date.now();
    var dirMap  = {
      '买入': 'b',
      '卖出': 's'
    }

    var retryTimes = 0;
    var up = 0.79;
    var down = 0.59;
    var records = [];

    maid.before();
    unlock.unlock();
    
    maid.sleep(1)
    toast("即将开始任务监控, 请放下设备等待处理!");
    // maid.kill();

    // 打开app
    maid.launch();
    maid.waitForActivity("io.dcloud.PandoraEntryActivity");
    maid.sleep(2);
    device.keepScreenOn(30 * 1000);

    if (text('欢迎登录NYW').exists()) {
      toast('请登录后重试！');
      exit();
      return;
    }

    var toGetRecords = function () {
      // 交易
      className("android.widget.RelativeLayout").depth(8).drawingOrder(2).clickable(true).click();
      maid.sleep(1);
    
      if (text("交易中心").exists()) {
        var moreRecords = text('更多').depth(14).findOne(300);
        moreRecords.click();
        maid.sleep(0.3);
      }

      if (text("持仓记录").exists()) {
        if (text('暂无内容').exists()) {
          maid.back();
          return;
        }

        var dirs = className("android.view.View").depth(14).find().filter(function (uc) {
          var textU = uc.text();
          return textU && text(textU).exists() && (textU === '买入' || textU === '卖出');
        }).map(uc => dirMap[uc.text()]).slice(1);

        var priceList = className("android.view.View").depth(13).find().filter(function (uc) {
          var textU = uc.text();
          //TODO： 原油价格暂定30-300
          return textU && text(textU).exists() && (/^\d+\.+\d+$/i).test(textU) && (textU >= 30 && textU < 300);
        }).map(uc => uc.text()).slice(-dirs.length);

        records = dirs.map((dir, index) => dir + '-' + priceList[index]);
        if (records.length) {
          console.info('----获取到 %d 条记录, 监控开始...', records.length);
          device.vibrate(500);
          // 持仓记录处理完成
          maid.back();
          toast('记录获取成功！自动提醒开始后台运行...');
          maid.sleep(1);

          var localData = storages.create("local");
          localData.put('consoleStatus', 'true');
        } else {
          toast('持仓记录获取失败，请关闭应用重试！');
        }
      } else {
        maid.back();
        maid.sleep(2);
        toGetRecords();
      }
    };
    console.show();
    toGetRecords();
    maid.sleep(0.5);

    var intervalId = setInterval(function() {
      stopLoop(Date.now());
      autoOp();
    }, 5 * 1000);

    var autoOp = function() {
      var curr = 0;

      var url = "https://api.jijinhao.com/quoteCenter/realTime.htm?codes=JO_108878";
      var options = {
        headers: {
          'User-Agentt': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
        }
      }

      try {
        var res = http.get(url, options);
        if (res.statusCode == 200){
          retryTimes = 0;
          var resultStr = res.body.string();
          if (resultStr) {
            var result = JSON.parse(resultStr.slice(resultStr.indexOf("{")))['JO_108878']['q63'];
            if (result) {
              curr = parseFloat(result);
              log('最新价格:', curr, ' --- ', new Date().Format("yyyy-MM-dd HH:mm:ss"), '\n');
            }
          }
        } else {
          retryTimes ++;
          if (retryTimes > 3) {
            toast("请求失败, 请停止任务重试！");
            stopLoop(0, true);
            return;
          }
          toast("请求失败:" + res.statusMessage);
          autoOp();
        };
      } catch (error) {
        console.error('！！！实时价格获取失败！！！')
      }

      if (records.length === 0) {
        console.info('-----监控停止----');
        stopLoop(0, true);
      }
      if (!curr ) {
        return;
      }

      for (var i = records.length -1; i >=0 ; i--) {
        var record = records[i];
        var tem = record.split('-');
        var dir = tem[0];
        var buy = parseFloat(tem[1]);
        maid.sleep(random());

        if ((dir === 'b' && curr >= buy + up) || (dir == 's' && curr <= buy - up)) {
          records.splice(i, 1);
          console.info("【通知】" , new Date().Format("yyyy-MM-dd HH:mm:ss") , dir + ":" + buy  + " 已止盈");
          // 响铃
          Bell();
          device.vibrate(3000);
        }

        if ((dir == 'b' && curr <= buy - down) || (dir == 's' && curr >= buy + down)) {
          records.splice(i, 1);
          // 止损
          console.error("【通知】" , new Date().Format("yyyy-MM-dd HH:mm:ss") , dir + ":" + buy  + " 已止损");
          // 响铃
          Bell();
          device.vibrate(3000);
        }
      }
    }

    function stopLoop (time, isStop) {
      isStop = isStop || false;
      if ((time - startDate >= space) || isStop) {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
          device.cancelKeepingAwake();
          
          //发送事件result通知主线程接收结果-停止
          eventer.emit('result', 'stop');

          // 停止
          maid.kill();
          maid.after();
          
        }
      }
    }

    autoOp();
  });

  thread.waitFor();
  eventer.on('result', function(s){
    if (s === 'stop') {
      // 停止线程
      thread.interrupt();
      engines.stopAll();
    }
  });
};

module.exports = AlertMain;
