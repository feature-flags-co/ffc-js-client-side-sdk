var container = document.getElementById("route-container");

Router.route('/router_1', function () {
    container.innerHTML = "Content_1";
    container.style.backgroundColor = "orange";
});
Router.route('/router_2', function () {
    container.innerHTML = "Content_2";
    container.style.backgroundColor = "yellow";
});
Router.route('/router_3', function () {
    container.innerHTML = "Content_3";
    container.style.backgroundColor = "skyblue";
})