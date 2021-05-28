# ffc-sdk-javascript

## 简易教程

以portal.feature-flags.co项目工程的"开关用户 - 属性管理"功能为例。在一开始完成功能上线时，我们希望将功能先开放给敏捷开关的内部工作人员。当内工作人员使用顺手后，发布给10%的客户使用。当10%的客户使用舒畅后，我们再开放给所有用户。

用户通过点击下图中的按钮来掉起"属性管理"功能模块，我们只需要将这个按钮暴露给不同的用户，即可控制"属性管理"功能模块的发布。

> 案例中的项目代码为angular.js

在项目代码中，我们只需要将ffc-sdk-javascript包裹控制开关显示的代码即可实现上述需求。

![](/readme/importandvariation.png)

在.html中，使用如下代码来控制按钮的visibility


![](/readme/visible.png)