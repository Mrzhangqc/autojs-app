"ui";

var ColoredButton = (function() {
   //继承ui.Widget
   util.extend(ColoredButton, ui.Widget);

   function ColoredButton() {
       //调用父类构造函数
       ui.Widget.call(this);
       //自定义属性color，定义按钮颜色
       this.defineAttr("color", (view, name, defaultGetter) => {
           return this._color;
       }, (view, name, value, defaultSetter) => {
           this._color = value;
           view.attr("backgroundTint", value);
       });
       //自定义属性onClick，定义被点击时执行的代码
       this.defineAttr("onClick", (view, name, defaultGetter) => {
           return this._onClick;
       }, (view, name, value, defaultSetter) => {
           this._onClick = value;
       });
   }
   ColoredButton.prototype.render = function() {
       return (
           <button textSize="16sp" style="Widget.AppCompat.Button.Colored" w="auto"/>
       );
   }
   ColoredButton.prototype.onViewCreated = function(view) {
       view.on("click", () => {
           if (this._onClick) {
               eval(this._onClick);
           }
       });
   }
   ui.registerWidget("colored-button", ColoredButton);
   return ColoredButton;
})();

showUI();
ui.statusBarColor("#32AFA9");
var localData = storages.create("local");
auto();
showConsole();

function showUI() {
   var alertMain = require("./common/Alert.js");
   var autoMain = require("./common/Auto.js");

   ui.layout(
      <frame id="frame" w="*" h="*">
         <vertical bg="#A4D4AE">
            <appbar>
               <toolbar id="toolbar" bg="#32AFA9" title="自动监控"/>
            </appbar>

            <vertical paddingTop="5" layout_weight="1">
               <card w="*" h="60" margin="10 5" cardCornerRadius="2dp" cardElevation="1dp" gravity="center_vertical">
                  <vertical padding="18 8" h="auto">
                     <text text="停止" textColor="#222222" textSize="16sp"/>
                     <text textColor="#666666" textSize="14sp">
                        停止所有的监控任务
                     </text>
                  </vertical>
                  <View bg="#f44336" h="*" w="10"/>
               </card>
               <card w="*" h="75" margin="10 5" cardCornerRadius="2dp" cardElevation="1dp" gravity="center_vertical">
                  <vertical padding="18 8" h="auto">
                     <text text="自动提醒" textColor="#222222" textSize="16sp"/>
                     <text textColor="#666666" textSize="14sp">
                        通过发送手机铃声和振动来提醒，手机可以锁屏状态下使用.
                     </text>
                  </vertical>
                  <View bg="#2196f3" h="*" w="10"/>
               </card>
               <card w="*" h="100" margin="10 5" cardCornerRadius="2dp" cardElevation="1dp" gravity="center_vertical">
                  <vertical padding="18 8" h="auto">
                     <text text="自动操作" textColor="#222222" textSize="16sp"/>
                     <text textColor="#666666" textSize="14sp">
                        自动买卖，手机需要保持常亮! 注意开启后不要手动关闭页面！如果不小心触碰，可以先点击停止按钮再点击自动操作继续.
                     </text>
                  </vertical>
                  <View bg="#4caf50" h="*" w="10"/>
               </card>
            </vertical>
           
            <vertical gravity="top" padding="30 0" layout_weight="2">
               <linear w="*" h="50">
                  <colored-button id="logShow" textColor="#ffffff" color="#666666" text="记录开关"/>
                  <colored-button id="logClear" textColor="#ffffff" color="#666666" text="清除记录"/>
               </linear>

               <colored-button w="*" h="50" id="stop" textColor="#ffffff" color="#f44336" text="停止任务"/>
               <colored-button w="*" h="50" marginTop="15" id="alert" color="#2196f3" textColor="#ffffff" text="自动提醒"/>
               <colored-button w="*" h="50" marginTop="15" id="auto" color="#4caf50" textColor="#ffffff" text="自动操作"/>

               <colored-button w="60" h="50" marginTop="15" layout_gravity="center" id="close" 
                  color="#999999" textColor="#ffffff" text="关闭"/>
            </vertical>
         </vertical>
      </frame>
   );


   // 日志开启关闭
   ui.logShow.click(function(){
      threads.start(function() {
         var consoleStatus = localData.get('consoleStatus');
         var status = !Boolean(JSON.parse(consoleStatus));
         sleep(500);
         if (status) {
            console.hide();
            console.show();
            localData.put('consoleStatus', 'true')
         } else {
            console.hide();
            localData.put('consoleStatus', 'false')
         }
      })
   });

   // 清除日志
   ui.logClear.click(function(){
      console.clear();
   });

   // 停止
   ui.stop.click(function(){
      ui.run(() => {
         confirm("确定停止全部监控任务？").then(function(ok) {
            if (ok) {
               console.clear();
               threads.shutDownAll();
               toast('任务已停止！');
               showConsole(false);
               exit();
            }
         });
      })
   });

   // 自动提醒
   ui.alert.click(function(){
      threads.shutDownAll();
      showConsole(false);

      toast('自动提醒任务已启动！');
      showLoadingUI(8 * 1000);
      alertMain();
   });

   // 自动操作
   ui.auto.click(function(){
      threads.shutDownAll();
      showConsole(false);

      toast('自动操作任务已启动！');
      showLoadingUI();
      autoMain();
   });

   // 退出
   ui.close.click(function(){
      threads.shutDownAll();
      
      // 阻塞操作开启新线程
      var newThread = threads.start(function() {
         showConsole(false);
         sleep(200);
         var result = require('./common/ExitApp.js').exitApp();
         if (result) {
            newThread.interrupt();
            exit();
         }
      })
   });
   
}


function showLoadingUI(timeout) {
   threads.start(function() {
      var bgColor = colors.toString(colors.argb(160, 0, 0, 0));
      var w = floaty.rawWindow(
         <frame gravity="center" bg={bgColor}>
            <text gravity="center" textColor="#ffffff" textSize="20sp">正在操作，请稍候...</text>
         </frame>
      );
      
      w.setSize(-1, -1);
      w.setTouchable(true);
      
      setTimeout(() => {
         w.close();
      }, timeout || 6000);
   })
}

function showConsole(show) {
   var newThread = threads.start(function() {
      console.hide();
      if (show === false) {
         localData.put('consoleStatus', 'false')
         return;
      };

      sleep(2000);
      var status = localData.get('consoleStatus');
      if (status) {
         if (Boolean(JSON.parse(status))) {
            console.clear();
            console.show();
         } else {
            console.hide();
         }
      } else {
         localData.put('consoleStatus', 'false')
      }
      newThread.interrupt();
   })
}

function DateFormat() {
   Date.prototype.Format = function (fmt) {
      var o = {
         "M+": this.getMonth() + 1, //月份
         "d+": this.getDate(), //日
         "H+": this.getHours(), //小时
         "m+": this.getMinutes(), //分
         "s+": this.getSeconds(), //秒
         "q+": Math.floor((this.getMonth() + 3) / 3), //季度
         "S": this.getMilliseconds() //毫秒
      };
      if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
      for (var k in o) {
         if (new RegExp("(" + k + ")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
         } 
      }
      return fmt;
   }
};
DateFormat();


