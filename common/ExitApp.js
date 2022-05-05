var _uiUtils = function () {
  var ROOT_NODE_NAME = 'FrameLayout';
  var TIMEOUT_FOR_LOOKUP_NODE = 250;

  // 获取当前应用的包名
  var getCurrentPackage = function getPackageNameOfTheForegroundApplication(timeout) {
    var node = getRootNode(timeout);
    return node !== null ? node.packageName() : currentPackage();
  };

  // 获取 FrameLayout 根节点
  var getRootNode = function getFrameLayoutNode(timeout) {
    return className(ROOT_NODE_NAME).findOne(timeout || TIMEOUT_FOR_LOOKUP_NODE);
  };

  // 获取所有指定节点及其子节点的描述内容和文本内容
  var getAllTextualContent = function getAllDescriptionAndTextUnderNodeRecursively(node) {
    var items = [];
    var getDescAndText = function(node) {
      if (node !== null) {
        items.push(node.desc());
        items.push(node.text());

        for (var len = node.childCount(), i = 0; i < len; i++) {
          getDescAndText(node.child(i));
        }
      }
    };

    getDescAndText(node || getRootNode());
    return items.filter(item => item !== '' && item !== null);
  };

  return {
    getCurrentPackage: getCurrentPackage,
    getAllTextualContent: getAllTextualContent,
  };
}

module.exports = (() => {
  var uiUtils = _uiUtils();

  // 通过模拟（多次）点击返回键退出当前应用，并显示当前应用的退出结果
  var exitApp = function exitForegroundApplicationUsingReturnKey() {
    return showResult(returnUntilExitingApp());
  };

  // 显示当前应用的退出结果
  var showResult = function showExitForegroundApplicationResult(result) {
    var state = result.success ? 'has exited' : 'cannot exit';
    var message = getAppName(result.package) + ' ' + state;
    toast(message);
    return result.success;
  };

  // 一直按下返回键，直至当前应用退出为止
  var returnUntilExitingApp = function keepReturningUntilExitingForegroundApplication() {
    var TIME_REQUIRED_FOR_RETURN = 100;
    var MAXIMUM_RETURN_IN_SAME_UI = 10;
    var prevPackage = uiUtils.getCurrentPackage();
    var result = { package: prevPackage, success: false };
    var sameui = getSameUiInfo();

    while (true) {
      back();
      sleep(TIME_REQUIRED_FOR_RETURN);

      if (uiUtils.getCurrentPackage() !== prevPackage) {
        result.success = true;
        break;
      }

      if (sameui.number + 1 >= MAXIMUM_RETURN_IN_SAME_UI) break;

      sameui.updateNum();
    }

    return result;
  };

  // 获取相同界面的次数
  var getSameUiInfo = function getInfoAboutNumberOfTimesOfTheSameUi() {
    return {
      number: 1,
      prevText: null,
      updateNum: function() {
        var curText = uiUtils.getAllTextualContent().toString();
        this.number = curText !== this.prevText ? 1 : this.number + 1;
        this.prevText = curText;
      },
    };
  };

  return {
    exitApp: exitApp,
    returnUntilExitingApp: returnUntilExitingApp,
  };
})();