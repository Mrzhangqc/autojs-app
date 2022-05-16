
function AutoMain() {

  var eventer = events.emitter(threads.currentThread());

  var thread = threads.start(function() {
    auto.waitFor();

    var GetBase = require("./Utils.js");
    var Maid = require("./Maid.js");
    var maid = new Maid('com.nyw.newnyw');
    var Unlock = require("./Unlock.js");
    var unlock = new Unlock();

    var space = 12 * 60 * 60 * 1000; // 12个小时监控
    var base = 10; // 10个算一手
    var startDate = Date.now();

    maid.before();
    unlock.unlock();
    
    maid.sleep(1)
    toast("即将开始定时任务, 请放下设备等待处理!");
    // maid.kill();

    // 打开app
    maid.launch();
    maid.waitForActivity("io.dcloud.PandoraEntryActivity");
    maid.sleep(4);
    device.keepScreenOn(space);
    
    if (text('欢迎登录NYW').exists()) {
      toast('请登录后重试！');
      exit();
      return;
    }

    var intervalId = setInterval(function() {
      stopLoop(Date.now());
      autoOp();
    }, 25 * 1000);

    console.show();
    console.clear();
    var autoOp = function() {
      var zichan = 0;
      var chicang = 0;
      var curr$ = 0;
      var max$ = 0;
      var min$ = 0;
      var doCount = 0;
      var keyongjin = 0;
    
      if (new Date().getMinutes() == 59 && new Date().getSeconds() < 25) {
        console.clear();
      }

      // 资产-tab4
      className("android.widget.RelativeLayout").depth(8).drawingOrder(4).clickable(true).click();
      maid.sleep(1);
      log('---进入资产页面---', new Date().Format("yyyy-MM-dd HH:mm:ss"));

      // var yj = className("android.widget.Image").text("by").findOne(1000);
      // if (yj) {yj.click()};
      // maid.sleep(1);
      
      if (textStartsWith('$').exists()) {
        var list$ = textStartsWith('$').find().map(t => t.text().slice(1));
        keyongjin = list$.slice(-2)[0];
        zichan = list$.slice(-3).slice(0,2).reduce((total, next) => {
          return total + Number(next);
        }, 0);
      }
      maid.sleep(1);
      
      var uc = className("android.view.View").depth(12).find();
      if (uc.nonEmpty()) {
        var list = uc.filter(v => v.text()).map(d => d.text());
        chicang = parseFloat(list[list.length - 5]);
      }
      maid.sleep(1);
    
      // 交易-tab2
      className("android.widget.RelativeLayout").depth(8).drawingOrder(2).clickable(true).click();
      maid.sleep(2);
      log('---进入交易页面---', new Date().Format("yyyy-MM-dd HH:mm:ss"));

      if (text("交易中心").exists()) {
        var prices = className("android.view.View").depth(13).find().filter(function(uc) {
          var text = uc.text();
          return text && (/现价\s:\s|.\(24H\)/g).test(text);
        }).map(function(uc) {
          return uc.text();
        });
    
        var _curr = prices[0];
        if (_curr) {curr$ = parseFloat(_curr.match(/\d+\.\d+/g))};
      
        var _max = prices[1];
        if (_max) {max$ = parseFloat(_max.match(/\d+\.\d+/g))};
    
        var _min = prices[2];
        if (_min) {min$ = parseFloat(_min.match(/\d+\.\d+/g))};

        if (zichan && curr$) {
          var yajin = GetBase(curr$);
          var total = (~~(zichan / yajin)) / base;
          doCount = Math.round((total - chicang) * 10);
          if (keyongjin/yajin < 1) return;

          if (doCount) {
            device.vibrate(300);

            var buy = ~~(doCount / 2);
            var sale = doCount - buy;
            
            if (doCount === 1) {
              random() >= 0.5 ? doBuy(curr$, buy) : doSale(curr$, sale);
            } else {
              doBuy(curr$, buy);
              doSale(curr$, sale);
            }
          }
          
        }
      }
    }

    function doBuy (price, buy) {
      // 准备买入
      var buyUc = text("买入").depth(15).findOne(1000);
      log('--准备买--');
      buyUc.click();
      maid.sleep(1);
      var plusBtn = className("android.view.View").depth(16).text("+").clickable(true).findOne(1000);
      maid.sleep(1);
      var doBuyBtn = text("买入").depth(17).findOne(2000).parent();
      maid.sleep(2);
      // 点击加号: 初始值1需要减去一次操作
      for (var i = 0; i < buy - 1; i++) {
        plusBtn.click();
        log('操作：',i + 1, '次')
        maid.sleep(0.5);
      }
      doBuyBtn.click();
      console.verbose('买入:', (buy || 1)/base, ' ', '价格:', price, ' ', new Date().Format("yyyy-MM-dd HH:mm:ss"), '\n');
      maid.sleep(1);
      var closeBtn = className("android.widget.Image").text("close").findOne(500);
      if (closeBtn) {
        // 点击抽屉上方模拟关闭
        closeBtn.parent().click();
      }
      maid.sleep(2);
    }
   
    function doSale(price, sale) {
      // 准备卖出
      var saleUc = text("卖出").depth(15).findOne(1000);
      log('--准备卖--');
      saleUc.click();
      maid.sleep(1);
      var plusSaleBtn = className("android.view.View").depth(16).text("+").clickable(true).findOne(1000);
      maid.sleep(1);
      var doSaleBtn = text("卖出").depth(17).findOne(2000).parent();
      maid.sleep(2);
      // 点击加号: 初始值1需要减去一次操作
      for (var j = 0; j < sale - 1; j++) {
        plusSaleBtn.click();
        log('操作：',j + 1, '次')
        maid.sleep(0.5);
      }
      doSaleBtn.click();
      console.info('卖出:', (sale || 1)/base, ' ', '价格:', price, ' ', new Date().Format("yyyy-MM-dd HH:mm:ss"), '\n');

      maid.sleep(1);
      var closeBtn = className("android.widget.Image").text("close").findOne(500);
      if (closeBtn) {
        // 点击抽屉上方模拟关闭
        closeBtn.parent().click();
      }
      maid.sleep(2);
    }

    function stopLoop (time) {
      if (time - startDate >= space) {
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

module.exports = AutoMain;
