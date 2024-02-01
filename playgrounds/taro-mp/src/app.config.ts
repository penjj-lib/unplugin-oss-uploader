export default {
  pages: ['pages/home', 'pages/mine'],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#E74E16',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home',
        text: '首页',
        iconPath: './assets/icon/index.png',
        selectedIconPath: './assets/icon/index_select.png',
      },
      {
        pagePath: 'pages/mine',
        text: '我的',
        iconPath: './assets/icon/category.png',
        selectedIconPath: './assets/icon/category_select.png',
      },
    ],
  },
  preloadRule: {},
}
