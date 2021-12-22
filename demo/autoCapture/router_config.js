//构造函数
function Router() {
    this.routes = {};
    this.currentUrl = '';
}
Router.prototype.route = function(path, callback) {
    //给不同的hash设置不同的回调函数
    this.routes[path] = callback || function(){};
};
Router.prototype.refresh = function() {
    //如果存在hash值则获取到，否则设置hash值为/
    this.currentUrl = location.hash.slice(1) || '/';
    if(this.currentUrl&&this.currentUrl!='/'){
        //根据当前的hash值来调用相对应的回调函数
        this.routes[this.currentUrl]();
    }

};
Router.prototype.init = function() {
    window.addEventListener('load', this.refresh.bind(this), false);
    window.addEventListener('hashchange', this.refresh.bind(this), false);
}
//给window对象挂载属性
window.Router = new Router();
window.Router.init();