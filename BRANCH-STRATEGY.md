# GameZipper 分支策略

## 分支架构

```
main          ← 生产分支（gamezipper.com，只含 Google AdSense）
gamemonetize  ← GameMonetize 发布分支（含 GM SDK + 激励广告）
```

## 规则

### main 分支
- gamezipper.com 的唯一生产源
- 只包含 Google AdSense（`adsbygoogle`）
- 不包含任何第三方游戏 SDK
- 所有新功能/修复在此开发

### gamemonetize 分支
- **只用于打包上传到 GameMonetize 平台**
- 始终基于 main 最新 rebase 而来
- 额外包含：
  1. GameMonetize SDK（`sdk.gamemonetize.com/sdk.js`）
  2. 游戏失败/关卡完成时的 `sdk.showBanner()` 调用
  3. 激励视频入口（「看广告继续」按钮）
- **不部署到 gamezipper.com**

## 发布流程（GameMonetize 新包）

```bash
# 1. 切到 gamemonetize 分支，rebase main 最新代码
git checkout gamemonetize
git rebase main

# 2. 应用 GM SDK 补丁到所有游戏
bash scripts/gm-build/apply-sdk.sh

# 3. 构建 ZIP 包（每个游戏一个 ZIP）
bash scripts/gm-build/build-zips.sh

# 4. 打 release 标签
git tag gm/v$(date +%Y-%m-%d)
git push origin gamemonetize --tags

# 5. 到 GameMonetize 后台上传 dist/gm/ 下的 ZIP 文件
```

## Release 存储
- 所有 GM ZIP 包存储在：`dist/gm/YYYY-MM-DD/`
- 每次上传留存备份，不 gitignore（存历史版本）

## GameMonetize SDK 集成规范

每个游戏的 `index.html` `<head>` 中需要加入：

```html
<!-- GameMonetize SDK -->
<script type="text/javascript">
window.SDK_OPTIONS = {
  gameId: "GAME_ID_HERE",  // 每个游戏不同的 GameId
  onEvent: function(a) {
    switch(a.name) {
      case "SDK_GAME_PAUSE":
        // 暂停游戏 + 静音
        if(window.gmPauseGame) window.gmPauseGame();
        break;
      case "SDK_GAME_START":
        // 恢复游戏 + 取消静音
        if(window.gmResumeGame) window.gmResumeGame();
        break;
      case "SDK_READY":
        window.sdkReady = true;
        break;
    }
  }
};
(function(a,b,c){
  var d=a.getElementsByTagName(b)[0];
  a.getElementById(c)||(a=a.createElement(b),a.id=c,
  a.src="https://api.gamemonetize.com/sdk.js",d.parentNode.insertBefore(a,d))
})(document,"script","gamemonetize-sdk");
</script>
```

每个游戏需要暴露两个全局函数：
```javascript
window.gmPauseGame = () => { /* 暂停逻辑 */ };
window.gmResumeGame = () => { /* 恢复逻辑 */ };
```

激励广告调用（游戏失败弹窗）：
```javascript
function showAdAndContinue(onContinue) {
  if(typeof sdk !== 'undefined') {
    sdk.showBanner();  // 展示广告
    // SDK_GAME_START 回调后恢复
    window.gmResumeGame = onContinue;
  } else {
    onContinue();  // 无 SDK 时直接继续
  }
}
```

## GameId 映射表

| 游戏目录 | GameMonetize GameId |
|---------|-------------------|
| sushi-stack | TBD（GameMonetize 后台获取）|
| color-sort | TBD |
| ocean-gem-pop | TBD |
| phantom-blade | TBD |
| catch-turkey | TBD |
| 其他... | TBD |
