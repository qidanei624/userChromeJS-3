// ==UserScript==
// @name           NextPage.uc.js
// @namespace nextpage2@slimx.com
// @description    翻页脚本
// @include        main
// @author         slimx
// @version 1.0.0.4
// @updateURL     https://j.mozest.com/ucscript/script/51.meta.js
// ==/UserScript==

        var nextPage = new function() {

            var config = {
                //快进,快退访问已浏览过的页面,操作太快的话,有些页面(尤其是discuz)的翻页可能会出现异常,可以改为false.
                //目前,启用预读的话,usehistory会自动禁用
                useHistory:true
                //是否搜索图片,有些问题,似乎无法正常工作
                ,searchImg:false
                //------------------------------------------------------------------------------
                //是否启用快捷键
                ,key_use:false
                //快捷键的冻结时间,即两次翻页的间隔,单位是毫秒
                ,key_freeze:1000
                //上一页的按键
                ,key_prev:"VK_LEFT"
                //下一页的按键
                ,key_next:"VK_RIGHT"
                //辅助键,默认是ctrl,不使用的话,改成false即可,也可以是alt,shift
                ,key_modifiers:false
                //------------------------------------------------------------------------------
                //预读模式:
                // 0,完全禁用预读
                //2,模式2,使用iframe置换的方式,效果最好,在模式2下,可以针对站点进行排除,被排除的站点会预读但不会置换
                ,prefetchMode:0
                //是否在状态栏显示预读开关
                ,prefetchSwitcher:false
                //开关的初始状态
                ,perfetchSwitcherInit:true
                //状态栏开关的标题
                ,prefetchSwitcherLabel:"Prefetch"
                //false是在domcontentloaded加载,true是在load加载,false预读的比较快,true比较不会影响当前页面的加载
                ,prefetchAfterLoad:false
                //最大的同时预读的页面,0的话,只对当前页面预读
                //目前,只允许值为0
                ,prefetchMax:0
                //启动预读的延迟时间,单位是秒,当prefetchAfterLoad是true的情况下,参数无效
                ,prefetchDelay:3
                //连续预读,不会因为切换页面而停止
                ,prefetchContinue:true
                //预读的内容开关
                ,prefetch_images : true//图片
                ,prefetch_javascript : true//脚本
                ,prefetch_redirect : true//重定向之后的文档
                ,prefetch_plugins: false//插件,比如flash
                ,prefetch_subframes: true//子窗口,frame,iframe
                ,prefetch_auth:false//安全验证

                //以下的设定在配置文件中修改
                //如果使用左,右方向键做翻页的快捷键的话(无论是否使用辅助键ctrl,alt等),需要将这个值改为true,否则discuz论坛会不正常
                ,isFix4Discuz:false
                //禁止在控制台输出
                ,isDisableLog:true
            };
//---------------------------------------------------------------------------------
            var rule = {};
//强制使用模拟点击方式的页面,比如淘宝的成交列表,使用正则的方式来判断
            rule.forceClick = [
                /item\.taobao\.com/i,
                /news\.163\.com\/photoview\//i,
	            /360buy\.com\/product/i,
                /music\.baidu.com/i,
                /blog\.sina\.com\.cn/i,
		    /weibo\.com/i
            ];


//完全禁止使用iframe方式预读,会转而使用xhr方式,兼容性比较好
            rule.disableIframe = [
                /^https?:\/\/\w{3,10}\.google(?:\.\w{1,4}){1,2}\/search/i,
                /image\.youdao\.com/i
            ];
//通用规则的站点,比如discuz和phpwind的论坛
            rule.specialCommon = [
                {siteName:'Discuz论坛帖子列表页面',
                    url:/^https?:\/\/[^\/]+\/(?:(?:forum)|(?:showforum)|(?:viewforum))/i,
                    preLink:'//div[@class="pages" or @class="pg"]/descendant::a[@class="prev"][@href]',
                    nextLink:'//div[@class="pages" or @class="pg"]/descendant::a[@class="next" or @class="nxt"][@href]'
                },
                {siteName:'Discuz论坛帖子内容页面',
                    url:/^https?:\/\/[^\/]+\/(?:(?:thread)|(?:viewthread)|(?:showtopic)|(?:viewtopic))/i,
                    preLink:'//div[@class="pages" or @class="pg"]/descendant::a[@class="prev"][@href]',
                    nextLink:'//div[@class="pages" or @class="pg"]/descendant::a[@class="next" or @class="nxt"][@href]'
                }
                ,
                {siteName:'phpWind论坛帖子列表页面',
                    url:/^https?:\/\/[^\/]+\/(?:bbs\/)?thread/i,
                    preLink:'//div[starts-with(@class,"pages")]/b[1]/preceding-sibling::a[1][not(@class)][@href] | //div[starts-with(@class,"pages")]/ul[1]/li[b]/preceding-sibling::li/a[1][not(@class)][@href]',
                    nextLink:'//div[starts-with(@class,"pages")]/b[1]/following-sibling::a[1][not(@class)][@href] | //div[starts-with(@class,"pages")]/ul[1]/li[b]/following-sibling::li/a[1][not(@class)][@href]'
                },
                {siteName:'phpWind论坛帖子内容页面',
                    url:/^https?:\/\/[^\/]+\/(?:bbs\/)?read/i,
                    preLink:'//div[starts-with(@class,"pages")]/b[1]/preceding-sibling::a[1][not(@class)][@href] | //div[starts-with(@class,"pages")]/ul[1]/li[b]/preceding-sibling::li/a[1][not(@class)][@href]',
                    nextLink:'//div[starts-with(@class,"pages")]/b[1]/following-sibling::a[1][not(@class)][@href] | //div[starts-with(@class,"pages")]/ul[1]/li[b]/following-sibling::li/a[1][not(@class)][@href]'
                }
            ];
//专用规则的站点
            rule.specialSite = [
                {siteName:'google搜索',                                                                                                                                //站点名字...(可选)
                    url:/^https?:\/\/\w{3,10}\.google(?:\.\w{1,4}){1,2}\/search/i,                                            //站点正则...(~~必须~~)
                    siteExample:'http://www.google.com',                                                                                                //站点实例...(可选)
                    enable:true,                                                                                                                                            //启用.(总开关)(可选)
                    useiframe:false,                                                                                                                                        //是否用iframe预读...(可选)
                    preLink:'//table[@id="nav"]/descendant::a[1][parent::td[@class="b"]]',            //上一页链接 xpath 或者 CSS选择器 或者 函数返回值 (prelink 和 nextlink最少填一个)
                    nextLink:'//table[@id="nav"]/descendant::a[last()][parent::td[@class="b"]]'             //下一页链接 xpath 或者 CSS选择器 或者 函数返回值 (prelink 和 nextlink最少填一个)
                    //true的话,即使没有找到结果也不会再继续检查了
                    ,disableSearch:false
                },
                {siteName:'google图片',
                    url:/^https?:\/\/\w{3,7}\.google(?:\.\w{1,4}){1,2}\/images/i,
                    siteExample:'http://images.google.com',
                    nextLink:'//table[@id="nav"]/descendant::a[last()][parent::td[@class="b"]]'
                },
                {siteName:'百度搜索',
                    url:/^https?:\/\/www\.baidu\.com\/(?:s|baidu)\?/i,
                    siteExample:'http://www.baidu.com',
                    enable:false,
                    nextLink:'//p[@id="page"]/a[text()="下一页"][@href]'
                    //nextLink:'div.p>a:last-of-type',
                },
                {siteName:'百度mp3',
                    url:/^http:\/\/mp3\.baidu\.com\/.+/i,
                    siteExample:'http://mp3.baidu.com/m?tn=baidump3&ct=134217728&lm=0&f=1&word=%CB%C0%C9%F1',
                    nextLink:'//div[@class="pg"]/a[(font/text()="下一页")]'

                },
                {siteName:'百度贴吧帖子列表页面',
                    url:/^http:\/\/tieba\.baidu\.com\/f\?.*kw=/i,
                    siteExample:'http://tieba.baidu.com/f?kw=opera&fr=tb0_search&ie=utf-8',
                    nextLink:'//div[@id="pagebar"]/div[@class="pagination"]/a[text()="下一页"]'

                },
                {siteName:'百度贴吧俱乐部帖子列表内容页面',
                    url:/^http:\/\/tieba\.baidu\.com\/club\/.+\/p\/.+/i,
                    siteExample:'http://tieba.baidu.com/club/6883547/p/4047809',
                    nextLink:'//div[@class="pagination"]/a[text()="下一页"]'

                },
                {siteName:'百度贴吧俱乐部帖子列表页面',
                    url:/^http:\/\/tieba\.baidu\.com\/club\/.+(?!\/p\/)/i,
                    siteExample:'http://tieba.baidu.com/club/6883547',
                    nextLink:'//div[@class="pagination"]/a[text()="下一页"]'

                },
                {siteName:'百度贴吧帖子内容页面',
                    url:/^http:\/\/tieba\.baidu\.com\/f\?kz=\d+/i,
                    siteExample:'http://tieba.baidu.com/f?kz=620671135',
                    nextLink:'//li[@class="pagination"]/a[text()="下一页"]'

                },
                {siteName:'万卷书库小说阅读页',
                    url:/^http:\/\/www\.wanjuan\.net\/article\/.+html/i,
                    useiframe:true,
                    nextLink:'//div[@id="gotopage"]/descendant::a[text()="下一页"]'

                },
                {siteName:'万卷书屋小说阅读页',
                    url:/^http:\/\/www\.wjxsw\.com\/html\/.+html/i,
                    useiframe:true,
                    nextLink:'//div[@id="LinkMenu"]/descendant::a[last()]'

                },
                {siteName:'起点小说阅读页',
                    url:/^http:\/\/www\.qidian\.com\/BookReader\/\d+,\d+/i,
                    siteExample:'http://www.qidian.com/BookReader/1545376,27301383.aspx',
                    useiframe:true,
                    nextLink:'//a[@id="NextLink"]'

                },
                {siteName:'冰地小说阅读页',
                    url:/^http:\/\/www\.bingdi\.com\/html\/book\/.+/i,
                    siteExample:'http://www.bingdi.com/html/book/130/153935/4201826.shtm',
                    useiframe:true,
                    nextLink:'//div[@id="LinkMenu"]/descendant::a[last()][text()="翻下页"]'

                },
                {siteName:'opera官方网站帖子列表页面',
                    url:/^http:\/\/bbs\.operachina\.com\/viewforum/i,
                    siteExample:'http://bbs.operachina.com/viewforum.php?f=41',
                    nextLink:'//div[starts-with(@class,"pagination")]/descendant::a[text()="下一页"]'

                },
                {siteName:'opera官方网站帖子内容页面',
                    url:/^http:\/\/bbs\.operachina\.com\/viewtopic/i,
                    siteExample:'http://bbs.operachina.com/viewtopic',
                    nextLink:'//div[starts-with(@class,"pagination")]/descendant::a[text()="下一页"]'

                },
                {siteName:'opera官方网站查看新帖帖子列表页面',
                    url:/^http:\/\/bbs\.operachina\.com\/search/i,
                    siteExample:'http://bbs.operachina.com/search.php?search_id=newposts',
                    nextLink:'//li[contains(@class,"pagination")]/descendant::a[text()="下一页"]'

                },
                {siteName:'深度论坛帖子内容页面',
                    url:/http:\/\/bbs\.deepin\.org\/thread/i,
                    siteExample:'http://bbs.deepin.org/thread',
                    nextLink:'//div[@class="pages"]/descendant::a[@class="next"]'

                },
                {siteName:'卡饭论坛帖子内容页面',
                    url:/http:\/\/bbs\.kafan\.cn\/thread/i,
                    siteExample:'http://bbs.kafan.cn/thread',
                    nextLink:'//div[@class="pg"]/descendant::a[@class="nxt"]'

                },
                {siteName:'卡饭论坛帖子列表页面',
                    url:/http:\/\/bbs\.kafan\.cn\/forum/i,
                    siteExample:'http://bbs.kafan.cn/forum-74-1.html',
                    nextLink:'//div[@class="pg"]/descendant::a[@class="nxt"]'

                },
                {siteName:'远景论坛帖子内容页面',
                    url:/http:\/\/bbs\.pcbeta\.com\/thread/i,
                    siteExample:'http://bbs.pcbeta.com/thread',
                    nextLink:'//div[@class="pages"]/descendant::a[@class="next"]'

                },
                {siteName:'思源论坛帖子内容页面',
                    url:/http:\/\/www\.missyuan\.com\/(?:view)?thread/i,
                    siteExample:'http://www.missyuan.com/thread-431242-1-1.html',
                    nextLink:'//div[@class="pages"]/descendant::a[@class="next"]'

                },
                {siteName:'思源论坛帖子列表页面',
                    url:/http:\/\/www\.missyuan\.com\/forum/i,
                    siteExample:'http://www.missyuan.com/forum-98-1.html',
                    nextLink:'//div[@class="pages"]/descendant::a[@class="next"]'

                },
                {siteName:'极点五笔帖子内容页面',
                    url:/www\.wbfans\.com\/bbs\/viewthread\.php/i,
                    siteExample:'http://www.wbfans.com/bbs/viewthread.php?tid=49308&extra=page%3D1',
                    nextLink:'//div[@class="pages"]/descendant::a[@class="next"]'

                },
                {siteName:'天极动漫频道新闻',
                    url:/http:\/\/comic\.yesky\.com\/\d+\/.+\.shtml/i,
                    siteExample:'http://comic.yesky.com/249/11335749_5.shtml',
                    nextLink:'//div[@id="numpage"]/descendant::a[contains(text(),"下一页")]'

                },
                {siteName:'赢政天下论坛帖子内容页面',
                    url:/http:\/\/bbs\.winzheng\.com\/viewthread/i,
                    siteExample:'http://bbs.winzheng.com/viewthread.php?tid=',
                    nextLink:'//div[@class="forumcontrol"]/descendant::a[@class="next"]'

                },
                {siteName:'soso网页搜索',
                    url:/http:\/\/www\.soso\.com\/q/i,
                    siteExample:'http://www.soso.com/q',
                    nextLink:'//div[@id="page"]/descendant::a[last()][@class="next"]'

                },
                {siteName:'bing网页搜索',
                    url:/bing\.com\/search\?q=/i,
                    siteExample:'bing.com/search?q=',
                    nextLink:'//div[@id="results_container"]/descendant::a[last()][@class="sb_pagN"]'

                },
                {siteName:'有道网页搜索',
                    url:/http:\/\/www\.youdao\.com\/search\?/i,
                    siteExample:'http://www.youdao.com/search?',
                    useiframe:true,
                    nextLink:'//div[@id="pagination"]/descendant::a[last()][@class="next-page"]'

                },

                {siteName:'煎蛋首页',
                    url:/http:\/\/jandan\.net\/(?:page)?/i,
                    siteExample:'http://jandan.net/',
                    useiframe:true,
                    nextLink:'//div[@class="wp-pagenavi"]/child::a[text()=">>"]'

                },
                {siteName:'中国教程网论坛帖子内容页面',
                    url:/http:\/\/bbs\.jcwcn\.com\/thread/i,
                    siteExample:'http://bbs.jcwcn.com/thread',
                    nextLink:'//div[@class="pages"]/descendant::a[@class="next"]'

                },
                {siteName:'kuku动漫',
                    url:/http:\/\/comic\.kukudm\.com\/comiclist\/\d+\/\d+.*\.htm/i,
                    siteExample:'http://comic.kukudm.com/comiclist/4/17099/3.htm',
                    useiframe:true,
                    nextLink:'//a[img[contains(@src,"images/d.gif")]]'

                },
                {siteName:'EZ游戏社区帖子内容页面',
                    url:/http:\/\/bbs\.emu-zone\.org\/newbbs\/thread/i,
                    siteExample:'http://bbs.emu-zone.org/newbbs/thread',
                    nextLink:'//div[@class="p_bar"]/a[contains(text(),"??")]'

                },
                {siteName:'mozest社区帖子内容页面',
                    url:/^https:\/\/g\.mozest\.com\/thread/i,
                    siteExample:'https://board.mozest.com/thread-34726-1-1',
                    nextLink:'//div[@class="pages"]/a[@class="next"]'

                },
                {siteName:'mozest社区帖子列表页面',
                    url:/^https:\/\/g\.mozest\.com\/forum/i,
                    siteExample:'https://board.mozest.com/forum-50-1',
                    nextLink:'//div[@class="pages"]/a[@class="next"]'

                },
                {siteName:'海贼王中文网漫画页',
                    url:/http:\/\/op\.52pk\.com\/manhua\/\d+\/\d+/i,
                    siteExample:'http://op.52pk.com/manhua/2010/921364.html',
                    nextLink:'//li[@id="page__next"]/a[1]'

                },
                {siteName:'死神中文网漫画页',
                    url:/http:\/\/sishen\.52pk\.com\/manhua\/\d+\/\d+/i,
                    siteExample:'http://sishen.52pk.com/manhua/2010/927406.html',
                    nextLink:'//li[@id="page__next"]/a[1]'

                },
                {siteName:'火影中文网漫画页',
                    url:/http:\/\/narutocn\.52pk\.com\/manhua\/\d+\/\d+/i,
                    siteExample:'http://narutocn.52pk.com/manhua/2010/921439.html',
                    nextLink:'li#page__next>a:first-child'
                    //nextLink:'//li[@id="page__next"]/a[1]',

                },
                {siteName:'塞班智能手机论坛帖子列表页面',
                    url:/http:\/\/bbs\.dospy\.com\/forum/i,
                    siteExample:'http://bbs.dospy.com/forum-354-1.html',
                    nextLink:'//div[@class="p_bar"]/a[@class="p_curpage"]/following-sibling::a[@class="p_num"]'

                },
                {siteName:'塞班智能手机论坛帖子内容页面',
                    url:/http:\/\/bbs\.dospy\.com\/thread/i,
                    siteExample:'http://bbs.dospy.com/thread-672836-1-52-1.html',
                    nextLink:'//div[@class="p_bar"]/a[@class="p_curpage"]/following-sibling::a[@class="p_num"]'

                },
                {siteName:'新华网新闻页面',
                    url:/http:\/\/news\.xinhuanet\.com\/.+\/\d+-/i,
                    siteExample:'http://news.xinhuanet.com/politics/2010-07/19/c_12347755.htm',
                    nextLink:'//div[@id="div_currpage"]/a[text()="下一页"]'

                },
                {siteName:'中关村在线新闻页面',
                    url:/http:\/\/(?:[^\.]+\.)?zol.com.cn\/\d+\/\d+/i,
                    siteExample:'http://lcd.zol.com.cn/187/1875145.html',
                    nextLink:'//a[text()="下一页>"][@href]'

                },
                {siteName:'天涯论坛帖子内容页面',
                    url:/http:\/\/www\.tianya\.cn\/.+\/content\/.+/i,
                    siteExample:'http://www.tianya.cn/publicforum/content/2010expo/4eddfdeea800b3957fd4781ff6004bc3/1/0/1.shtml',
                    nextLink:'//*[@id="pageDivTop" or @class="pages"]/descendant::a[text()="下一页"][@href]'

                },
                {siteName:'色影无忌帖子内容页面',
                    url:/http:\/\/forum\.xitek\.com\/showthread/i,
                    siteExample:'http://forum.xitek.com/showthread.php?threadid=571986',
                    nextLink:'//font[@size="2"]/font[@class="thtcolor"]/following-sibling::a[@href]'

                },
                {siteName:'梦想文学',
                    url:/^http:\/\/www\.mx99\.com\/html\/book\/.+html/i,
                    useiframe:true,
                    nextLink:'//div[@id="thumb"]/a[4]'

                },
                {siteName:'招聘区,杭州19楼,帖子内容',
                    url:/^http:\/\/www\.19lou\.com\/forum.*thread/i,
                    siteExample:'http://www.19lou.com/forum-1502-thread-29762777-1-1.html',
                    nextLink:'//div[@class="pages"]/descendant::a[text()="下一页"][@href]',
                    useiframe:true

                },
                {siteName:'招聘区,杭州19楼,帖子列表',
                    url:/^http:\/\/www\.19lou\.com\/forum/i,
                    siteExample:'http://www.19lou.com/forum-1500-1.html',
                    nextLink:'//div[@class="pages"]/descendant::a[text()="下一页"][@href]'

                },
                {siteName:'汽车之家论坛帖子内容',
                    url:/^http:\/\/club\.autohome\.com\.cn\/bbs\/thread/i,
                    siteExample:'http://club.autohome.com.cn/bbs/thread-a-100019-7383135-1.html',
                    nextLink:'//div[@class="pages"]/a[@title="下1页"][@href]'

                },
                {siteName:'爱卡汽车论坛帖子内容',
                    url:/^http:\/\/www\.xcar\.com\.cn\/bbs\/viewthread/i,
                    siteExample:'http://www.xcar.com.cn/bbs/viewthread.php?tid=12474760',
                    nextLink:'//a[text()="下一页＞"][@href]'

                },
                {siteName:'猫扑大杂烩帖子内容',
                    url:/http:\/\/dzh\.mop\.com\/topic\/readSub/i,
                    nextLink:'//a[contains(text(),"下一页")][@href]'

                },
                {siteName:'水木社区帖子内容页面',
                    url:/http:\/\/www\.newsmth\.net\/bbstcon/i,
                    nextLink:'//a[text()="下一页"][@href]',
                    useiframe:true

                },
                {siteName:'VeryCD搜索页面',
                    url:/http:\/\/www\.verycd\.com\/search\/folders.+/i,
                    siteExample:'http://www.verycd.com/search/folders/opera',
                    nextLink:'//div[@class="pages-nav"]/a[contains(text(),"下一页")][@href]'

                },
                {siteName:'照片处理网',
                    url:/http:\/\/www\.photops\.com\/Article\/.+/i,
                    siteExample:'http://www.photops.com/Article/xsjc/20100728172116.html',
                    nextLink:'//a[text()="下一页"][@href]'

                },
                {siteName:'178在线漫画',
                    url:/http:\/\/manhua\.178\.com\/.+\/.+\/.+/i,
                    siteExample:'http://manhua.178.com/h/haizeiwang/10062.shtml',
                    loaded:true,
                    nextLink:'//div[@class="pages"]/a[text()="下一页"][@href]'

                },
                {siteName:'sosg论坛帖子内容',
                    url:/http:\/\/www\.sosg\.net\/read/i,
                    siteExample:'http://www.sosg.net/read.php?tid=424833',
                    nextLink:'//td[@align="left"]/b/following-sibling::a[@href]'

                },
                {siteName:'flickr搜索',
                    url:/http:\/\/www\.flickr\.com\/search\/\?q=/i,
                    siteExample:'http://www.flickr.com/search/?q=opera',
                    nextLink:'//div[@class="Paginator"]/a[@class="Next"][@href]'

                },
                {siteName:'搜狗浏览器论坛帖子页面',
                    url:/http:\/\/ie\.sogou\.com\/bbs\/forumdisplay\.php/i,
                    siteExample:'http://ie.sogou.com/bbs/forumdisplay.php?fid=2',
                    nextLink:'//div[@class="pages"]/a[@class="next"][@href]'

                },
                {siteName:'搜狗浏览器论坛帖子内容页面',
                    url:/http:\/\/ie\.sogou\.com\/bbs\/viewthread\.php/i,
                    siteExample:'http://ie.sogou.com/bbs/viewthread.php?tid=203223&extra=page%3D1',
                    nextLink:'//div[@class="pages"]/a[@class="next"][@href]'

                },
                {siteName:'小说梦阅读页',
                    url:/http:\/\/www\.xiaoshuomeng\.com\/book\/.+\/zhangjie\/.+/i,
                    siteExample:'http://www.xiaoshuomeng.com/book/3967/zhangjie/1/',
                    nextLink:'//a[text()="下一章"][@href]'
                }

                ,
                {
                    siteName:'和讯博客',
                    url:/blog\.hexun\.com/i,
                    nextLink:'//a[text()="下一页"]',
                    preLink:'//a[text()="上一页"]'
                },
                {
                    siteName:'百书库',
                    url:/baishuku\.com/i,
                    nextLink:'//a[text()="下一页(快捷键:→)"]',
                    preLink:'//a[text()="(快捷键:←)上一页"]'
                },
                {
                    siteName:'海报网',
                    url:/haibao\.cn/i,
                    nextLink:'//a[@class="right tright"]',
                    preLink:'//a[@class="left tleft"]'
                },
                {
                    siteName:"凤凰网",
                    url:/ifeng\.com.*\/(bigpicture|hdsociety)\/detail_/i,
                    nextLink:function() {
                        content.location.href = content.wrappedJSObject.nextLink;
                    },
                    preLink:function() {
                        content.location.href = content.wrappedJSObject.preLink;
                    }
                },
                {
                    siteName:"凤凰网",
                    url:/ifeng\.com.*\/detail_/i,
                    nextLink:"//a[@id='nextLink']",
                    preLink:"//a[@id='preLink']"

                },
                {
                    siteName:"瘾科技",
                    url:/cn\.engadget\.com/i,
                    nextLink:"//a[text()='Next 20 Comments']",
                    preLink:"//a[text()='Previous 20 Comments']"
                },
                {
                    siteName:"xda",
                    url:/forum\.xda-developers\.com\/showthread\.php\?/i,
                    nextLink:"//a[@rel='next']",
                    preLink:"//a[@class='pagination-prev']"
                },
                {
                    siteName:"android market",
                    url:/play\.google\.com/i,
                    nextLink:"//div[contains(@class,'num-pagination-next')]",
                    preLink:"//div[contains(@class,'num-pagination-previous')]"
                },
                {
                    siteName:"163 图片新闻",
                    url:/news\.163\.com\/photoview\//i,
                    nextLink:"//a[@id='photoNext']",
                    preLink:"//a[@id='photoPrev']"
                },
	        {
                    siteName:"贴吧看图",
                    url:/tieba\.baidu\.com\/photo/i,
                    nextLink:"//a[@class='image_original_next']",
                    preLink:"//a[@class='image_original_prev']"
                }
                

            ];

// 下一页链接里的文字
            var next = {};
            var previous = {};
            var first = {};
            var last = {};
//链接中的文字
            next.texts = [
                'next',
                'next page',
                'old',
                'older',
                'earlier',
                '下页',
                '下頁',
                '下一頁',
                '后一页',
                '后一頁',
                '翻下页',
                '翻下頁',
                '后页',
                '后頁',
                '下翻',
                '下一个',
                '下一张',
                '下一幅',
                '下一节',
                '下一章',
                '下一篇',
                '后一章',
                '后一篇',
                '往后',
                "Next photo",
                '下一页',
                '下1页',
                '下1頁',
                'newer entries',
                ''
            ];
            previous.texts = [
                'previous',
                'prev',
                'previous page',
                'new',
                'newer',
                'later',
                '上页',
                '上頁',
                '上一页',
                '上一頁',
                '前一页',
                '前一頁',
                '翻上页',
                '翻上頁',
                '前页',
                '前頁',
                '上翻',
                '上一个',
                '上一张',
                '上一幅',
                '上一节',
                '上一章',
                '上一篇',
                '前一章',
                '前一篇',
                '往前',
                'Previous photo',
                '上1页',
                '上1頁',
                'older entries',
                ''
            ];
//首页和尾页的链接文字
            first.texts = ["首页","第一页","第1页","<<","«"];
            last.texts = ["最后","末尾","末页","尾页",">>","»"];

//可能会误判的词
            next.continueTexts = [">>","»"];
            previous.continueTexts = ["<<","«"];
            first.continueTexts = ["首页"];
            last.continueTexts = [];

//链接或其他标签的属性,比如id,class,title之类使用的
            next.attrValue = /^(next(link)?|linknext|pgdown)$/i;
            previous.attrValue = /^(prev(ious)?(link)?|linkprev(ious)?|pgup)$/i;

// 翻页文字的前面和后面可能包含的字符,
            next.startRegexp = /(?:^\s*(?:[\(\[『「［【]?)\s*)/;
            next.endRegexp = /(?:\s*([＞>›»]*)|(?:[\)\]』」］】→]?)\s*$)/;

            previous.startRegexp = /(?:^\s*([＜<‹«]*)|(?:[\(\[『「［【←]?)\s*)/;
            previous.endRegexp = /(?:\s*(?:[\)\]』」］】]?)\s*$)/;

            last.startRegexp = /(?:^\s*(?:[\(\[『「［【]?)\s*)/;
            last.endRegexp = /(?:\s*([＞>›»]*)|(?:[\)\]』」］】→]?)\s*$)/;

            first.startRegexp = /(?:^\s*([＜<‹«]*)|(?:[\(\[『「［【←]?)\s*)/;
            first.endRegexp = /(?:\s*(?:[\)\]』」］】]?)\s*$)/;

//---------------------------------------------------------------------------------
            var current = null;
            const discuzRegexp = /\/forumdisplay\.php\?fid=\d+/i;
            const emptyRegexp = /^\s$/;
//---------------------------------------------------------------------------------
//控制台输出
            function log(str) {
                if (config.isDisableLog)return;
                Components.classes["@mozilla.org/consoleservice;1"]
                        .getService(Components.interfaces.nsIConsoleService).logStringMessage(str);

            }

//检查字符串是否为空
            function isEmpty(str) {
                if (!str)return  true;
                if (emptyRegexp.test(str))return true;
                return false;
            }

//有些操作,比如事件等,必须用沙箱方式才行
            function getUnsafeWindow(win) {
                win = win || content;
                let sandbox = Components.utils.Sandbox(win);
                sandbox.unsafeWindow = win.wrappedJSObject;
                return sandbox.unsafeWindow;
            }

//检查站点的地址是否和列表匹配
            function isMatch(e, index, array) {
                return e.test(getCurrentHref(this))
            }

            /**
             * 当前页面/给定窗口的链接
             */
            function getCurrentHref(win) {
                win = win || content;
                return win.document.location.href;
            }

            /**
             *清理临时存储的变量
             */
            function cleanVariable() {
                try {
                    current = null;
                    next.link = next.found = next.digital = next.win = next.dir = next.searchFrom = null;
                    previous.link = previous.found = previous.win = previous.dir = previous.searchFrom = null;

                    first.link = first.found = first.win = first.dir = first.searchFrom = null;
                    last.link = last.found = last.win = last.dir = last.searchFrom = null;
                } catch(e) {
                }
            }

//更新变量
            function updateCurrent(item, window, notFound) {
                current.link = item;
                current.found = !notFound;
                current.win = window;
            }

            function getVersion() {
                var info = Components.classes["@mozilla.org/xre/app-info;1"]
                        .getService(Components.interfaces.nsIXULAppInfo);
                return parseInt(info.version.substr(0, 3) * 10, 10) / 10;
            }

//-----------------------------------------------------------------------------------

            /**
             * 检查特殊链接
             */
            function checkDefinedNext(win, searchSub) {
                win = win || content;
                let doc = win.document;
                //明确的地址
                let search = function(array) {
                    for (let i = 0; i < array.length; i++) {
                        if (doc.location.href.match(array[i].url)) {
                            let xpath = array[i][current.dir];
                            //字符串且是翻页
                            if (typeof(xpath) == "function" && searchSub) {
                                cleanVariable();
                                xpath();
                                return -1;
                            }
                            else {
                                //如果不存在规则,返回
                                if (!xpath || emptyRegexp.test(xpath)) return 0;
               let link;
               try{
                                link = doc.evaluate(xpath, doc, null, 9, null).singleNodeValue;
                                //没有匹配的结果,返回
                                
                                    if (!link) return array[i]["disableSearch"] ? -1 : 0;
                                } catch(e) {
                                    return 0;
                                }
                                current.link = link;
                                current.found = true;
                                current.win = win;
                                return 1;
                            }
                        }
                    }
                };
                if (search(rule.specialSite) || search(rule.specialCommon)) return 1;
                //对子窗口应用特殊规则
                if (searchSub) {
                    let f = win.frames;
                    for (let i = 0; i < f.length; i++) {
                        let c = checkDefinedNext(f[i]);
                        if (c == 1 || c == -1)return c;
                    }
                }
            }

            function checkNext(window) {
                window = window || content;
                //检查连接
                checkLinks(window);
                if (current.found) return;
                //检查按钮
                checkTags(window, "INPUT")
                //检查图片
                if (current.found) return;
                if (config.searchImg)
                    checkTags(window, "IMG")
            }

            /**
             * 检查图片元素,和其他的元素
             * @param window
             * @param tag
             *
             */
            function checkTags(window, tag) {
                let items = window.document.getElementsByTagName(tag);
                let item,text;
                for (let i = 0; i < items.length; i++) {

                    item = items[i];
                    if (!isEffective(item)) continue;

                    if (tag == "INPUT") {
                        //按钮的话,检查value属性
                        text = item.value;
                    }
                    else if (tag == "IMG")
                    //图片的话,就检查alt和title属性
                        text = item.alt || item.title;
                    else
                    //其他标签,就检查内容
                        text = item.innerHTML;

                    if (current.fullRegExp.test(text)) {
                        if(RegExp.$1=="" && RegExp.$2=="")continue;
                        if (current.continueTexts.indexOf(RegExp.$2) == -1) {
                            updateCurrent(item, window);
                            return;
                        }
                        else if (!isTempFound) {
                            isTempFound = true;
                            updateCurrent(item, window, true);
                        }
                    }
                }
            }

            /**
             *
             */
            function checkLinks(window) {
                let items = window.document.getElementsByTagName('A');
                let item,text,value;
                let isTempFound = 0;
                for (let i = 0; i < items.length; i++) {
                    item = items[i];
                    if (!isEffective(item,window)) continue;
                    log(item.href)
                    //textContent 加了title会不会有问题?
                    text = item.textContent || item.title;
                    //inner img
                    if (isEmpty(text)) {
                        let imgs = item.children;

                        for (let i = 0; i < imgs.length; i++) {
                            if (imgs[i].nodeName != "IMG")continue;
                            text = imgs[i].title || imgs[i].alt;
                            if (!isEmpty(text))break;
                        }
                    }
                    if (isEmpty(text))continue;
                    if (num.isDigital(text) && (isTempFound < 2) && (current.dir == "nextLink" || current.dir == "preLink")) {
                        //可能会误判,所以继续检测
                        let linkNumber = parseInt(RegExp.$1);
                        let type = (current.dir == "nextLink") ? -1 : 1;
                        let node = num.getPageNode(item, linkNumber, type, window.document);
                        if (node) {
                            isTempFound = 2;
                            //检测出来结果之后,并不结束,继续检查其他的连接,如果在没有其他的结果,才使用现在的这个
                            updateCurrent(item, window, true);
                        }
                    }
                    else {
                        if (current.fullRegExp.test(text)) {
                            if(RegExp.$1=="" && RegExp.$2=="")continue;
                            //可能的误判问题,$1可以得到实际匹配的结果
                            log("regexp is:" + RegExp.$1);
                            if (current.continueTexts.indexOf(RegExp.$2) == -1) {
                                updateCurrent(item, window);
                                return;
                            }
                            else if (isTempFound == 0) {
                                isTempFound = 1;
                                updateCurrent(item, window, true);
                            }
                            //这里似乎还是有问题啊,只能保存一次,不过获取到两次以上可能出错结果的情况应该不会太多吧
                        }
                    }
                }
                //将之前记录的通过翻页计算的结果作为最终的结果
                if (!current.found && isTempFound) {
                    current.found = true;
                    return;
                }

            }

            /**
             * 判断元素是否是有效的,比如隐藏的,就被认为是无效的
             * @param e
             */
            function isEffective(e,win) {
                //localname在3.5和之后的版本中是不一致的,为了避免这个问题,使用nodeName

                if (e.nodeName == "A") {
                    //如果不是当前域,跳过
                    if(/^https?:/i.test(e.href)&&e.hostname!=win.location.hostname)
                        return false;
                    //有这个必要吗
                    if (e.href && !/^\s*$|^https?:|^javascript:|^file:/i.test(e.href))
                        return false;
                    // 跳过不起作用的链接
                    if (!e.offsetParent || e.offsetWidth == 0 || e.offsetHeight == 0 || (!e.hasAttribute("href") && !e.hasAttribute("onclick")))
                        return false;
                    // 跳过日历
                    if (/(?:^|\s)(?:monthlink|weekday|day|day[\-_]\S+)(?:\s|$)/i.test(e.className))
                        return false;
                    return true;
                }
                else if (e.nodeName == "IMG") {
                    //todo 对图像的初步的排查
                    return true;
                }
                else if (e.nodeName == "INPUT") {
                    if (e.disabled)return false;
                    if (e.type != "button" && e.type != "submit")return false;
                    return true;
                    //有的事件是通过addeventlistner添加的,所以这个应该取消掉
                    //if(!e.onclick)return false;
                }
                else {
                    //暂时没有用到
                    try {
                        return e.style.display != "none";
                    } catch(e) {
                        return false;
                    }
                }
            }


            function checkNextInIframe(frame) {
                if (frame) {
                    log("check special frame")
                    checkNext(frame);
                }
                else {
                    log("check all frames")
                    let f = content.frames;

                    for (let i = 0; i < f.length; i++) {
                        checkNext(f[i])
                        if (current.found) {
                            return;
                        }
                    }
                }
            }

            var num = new function() {
                // 取得相邻的纯数字节点，type: 1 下一个；-1 上一个
                function getSiblingNode(node, type) {
                    if (!node) return null;
                    node = getSibling(node, type);
                    while (node && (node.nodeName == "#coment" ||
                            (/^\s*[\]］】]?[,\|]?\s*[\[［【]?\s*$/.test(node.textContent))))
                        node = getSibling(node, type);
                    return node;
                }

                function getSibling(aNode, type) {
                    if (!aNode) return null;
                    if (isOnlyNode(aNode)) {
                        try {
                            aNode = (type == 1 ? aNode.parentNode.nextSibling : aNode.parentNode.previousSibling);
                            if (skipNode(aNode))
                                aNode = (type == 1 ? aNode.nextSibling : aNode.previousSibling);
                            aNode = aNode.childNodes[0];
                            if (skipNode(aNode))
                                aNode = aNode.nextSibling;
                        }
                        catch (e) {
                            return null;
                        }
                    }
                    else {
                        aNode = (type == 1 ? aNode.nextSibling : aNode.previousSibling);
                    }
                    return aNode;
                }

                function isOnlyNode(n) {
                    return !n.nextSibling && !n.previousSibling ||
                            !n.nextSibling && skipNode(n.previousSibling) && !n.previousSibling.previousSibling ||
                            !n.previousSibling && skipNode(n.nextSibling) && !n.nextSibling.nextSibling ||
                            skipNode(n.previousSibling) && !n.previousSibling.previousSibling &&
                                    skipNode(n.nextSibling) && !n.nextSibling.nextSibling;
                }

                function skipNode(sNode) {
                    return sNode && /*sNode.nodeName == "#text" &&*/ (/^\s*$/.test(sNode.textContent));
                }

                // 检测是否有下一页的纯数字链接，number:页数
                function getNextLink(node, number, aSet) {
                    var tNode = getSiblingNode(node, 1);
                    if (tNode && tNode.nodeName == "A" && this.isDigital(tNode.textContent)) {
                        if (RegExp.$1 == number) {
                            // 找到纯数字链接
                            if (aSet) {
                                next.link = tNode;
                                next.found = true;
                            }
                            return tNode;
                        }
                    }
                    return null;
                }

                this.isDigital = function(str, t) {
                    str = str.replace(/^\s+|\s+$/g, "");
                    if (t == -1)
                        str = str.split(/\s+/).pop();
                    else if (t == 1)
                        str = str.split(/\s+/)[0];
                    return (/^(\d+)$/.test(str)) ||
                            (/^\[\s?(\d+)\s?\]$/.test(str)) ||
                            (/^【\s?(\d+)\s?】$/.test(str)) ||
                            (/^［\s?(\d+)\s?］$/.test(str)) ||
                            (/^<\s?(\d+)\s?>$/.test(str)) ||
                            (/^＜\s?(\d+)\s?＞$/.test(str)) ||
                            (/^『\s?(\d+)\s?』$/.test(str)) ||
                            (/^「\s?(\d+)\s?」$/.test(str)) ||
                            (/^第\s?(\d+)\s?页$/.test(str));
                }

                // 判断是否是当前页面的数字，type:-1,0,1 分别是要判别的上一个、当前、下一个节点
                this.getPageNode = function (node, linkNum, type, doc) {
                    var tNode;
                    if (type == 0) {
                        tNode = getSiblingNode(node, 1) || getSiblingNode(node, -1);
                        if (!tNode) return null;
                        if (!node.hasAttribute("onclick") && node.href != tNode.href &&
                                (!node.hasAttribute("href") && this.isDigital(node.textContent, type) ||
                                        !(/\/#[^\/]+$/.test(node.href)) && node.href == doc.location.href && this.isDigital(node.textContent, type))) {
                            if (linkNum > 0 && RegExp.$1 == linkNum) return node;
                        }
                        // 某些论坛处在第一页时，实际链接和当前页链接不符，只有和其余纯数字链接的结构或颜色不同时，
                        // 才使用纯数字的“2”作为“下一页”的链接。
                        else if (!next.digital && (/^\s*[\[［【]?1[\]］】]?\s*$/.test(node.textContent))) {
                            var two = getNextLink(node, 2);
                            if (two && difDigital(node, two, doc))
                                next.digital = two;
                        }
                    }
                    else {
                        tNode = getSiblingNode(node, type);
                        if (!tNode) return null;
                        if (tNode.nodeName != "A" && this.isDigital(tNode.textContent, type) ||
                                tNode.nodeName == "A" && !tNode.hasAttribute("onclick") && node.href != tNode.href &&
                                        (!tNode.hasAttribute("href") && this.isDigital(tNode.textContent, type) ||
                                                !(/\/#[^\/]+$/.test(tNode.href)) && tNode.href == doc.location.href && this.isDigital(tNode.textContent, type))) {
                            var n = linkNum + type;
                            if (n > 0 && RegExp.$1 == n) {
                                if (next.digital) next.digital = null;
                                return tNode;

                            }
                        }
                    }
                    return null;
                }

                function difDigital(node1, node2, doc) {
                    if (getStructure(node1) == getStructure(node2) && getStyleColor(node1, doc) == getStyleColor(node2, doc))
                        return false;
                    return true;
                }

                function getStructure(aNode) {
                    return aNode.innerHTML.replace(/\d+/, "");
                }

                function getStyleColor(aNode, doc) {
                    //得到得到的是最终的样式
                    return doc.defaultView.getComputedStyle(aNode, null).getPropertyValue("color");
                }
            }
//-----------------------------------------------------------------------------------
            /**
             * 打开链接,这个是实际打开链接的方法
             */
            function openLink() {
                let linkNode = current.link;
                let win = current.win;

                fix4Discuz();

                

                //add a delay
                config.key_pressed = true;
                setTimeout(function() {
                    config.key_pressed = false;
                }, config.key_freeze);

                if (isGoAsLink()) {
                    log("as link")
                    //直接打开链接的方式,这种方式之所以优先,是可能会利用到history
                    if (loadFromHistory()) {
                        return;
                    }
                    if (loadFromPrefetch()) {
                        return;
                    }
                    cleanVariable();
                    win.document.location.assign(linkNode.href);
                }
                else {
                    log("as click")
                    //模拟点击的方式,会比较可靠
                    //这个延时是为了防止重复点击的,不过好像没有效果
//            setTimeout(cleanVariable, 300);
                    cleanVariable()
                    let e = win.document.createEvent("MouseEvents");
                    e.initMouseEvent("click", 1, 1, win, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, linkNode);
                    linkNode.dispatchEvent(e);
                }
            }

            /**
             *  从历史纪录快速加载已经访问过的页面
             */
            function loadFromHistory(isSearchOnly) {
                let linkNode = current.link;
                if (config.useHistory) {
                    let his = gBrowser.sessionHistory;
                    for (let i = 0; i < his.count; i++) {
                        let uri = his.getEntryAtIndex(i, true).QueryInterface(Components.interfaces.nsISHEntry);
                        if (uri.URI.spec == linkNode.href || fix4History(uri.URI.spec, linkNode.href)) {
                            log("load from history")
                            if (!isSearchOnly) {
                                gBrowser.gotoIndex(i);
                            }
                            //清理临时变量
                            cleanVariable();
                            return true;
                        }
                    }
                }
                return false;
            }

//调整一些url的匹配,去掉一些随机的参数之类的,能够更好的利用到历史记录
            function fix4History(href1, href2) {
                //google 搜索修正,因为会加入随机的参数,导致无法使用history
                if (/www\.google\.com(\.hk|\.cn)?\/search\?/i.test(href2)) {
                    //这两个都是随机的的值,每次搜索都是不一样的结果
                    let h1 = href1.replace(/&ei=\w*&|&hs=\w*&/ig, "&");
                    let h2 = href2.replace(/&ei=\w*&|&hs=\w*&/ig, "&");
                    if (h1 == h2)
                        return true;
                    //
                }

                return false;
            }

            /**
             * 判断是否按照普通链接的方式来执行,返回false的话就使用模拟点击的方式处理
             */
            function isGoAsLink() {
                let linkNode = current.link;
                if(linkNode.nodeName!="A")return false;
                let href = linkNode.getAttribute("href");
                let referrer = getCurrentHref(current.win)
                //强制使用模拟点击的
                if (rule.forceClick.some(isMatch, current.win))
                    return false;

                //href属性不存在或者无效的情况
                if (!href) return false;
                if (emptyRegexp.test(href)) return false;
                //包括javascript处理
                if (linkNode.hasAttribute("onclick"))return false;
                //todo 这里似乎是有问题的
//                if (href.indexOf("javascript:void(0)") == 0)return false;
                if (href.indexOf("javascript:") == 0)return false;
                //如果链接于当前页面地址相同,必定是有js的处理,当然,也可能就是当前页面
                if (referrer && href == referrer)return false;
                if(href=="#")return false;
                if (!linkNode.target || /^\s*$|^_?(blank|self)$/.test(linkNode.target)) {
                    //链接在当前窗口
                }
                else if (/^_?(parent|top)$/.test(linkNode.target)) {
                    //寻找到目标窗口
                        current.win = current.win[RegExp.$1];
                }
                //再找不到就是自定的窗口了,这个就不必处理,改为使用模拟点击的方式
                else {
                    //当然,可以再找到目标窗口,不过这样做没有什么必要,因为不是top窗口,也无法利用到历史记录的
                    return false;
                }
                return true;
            }

            /**
             *     修改页面,保证在使用方向键的时候,discuz页面的正常
             */
            function fix4Discuz(win) {
                win = win || content;
                if (config.isFix4Discuz
                        && getCurrentHref(win).match(discuzRegexp)) {
                    alert(1)
                    getUnsafeWindow(win).document.onkeyup = null;
                }
            }

            this.next = function(direction, excuter, mark) {
                if (config.key_pressed)return;
                let time = new Date().getTime();
                if (mark) {
                    current = mark == "firstLink" ? first : last;
                    current.dir = mark;
                } else {
                    current = direction ? next : previous;
                    current.dir = direction ? "nextLink" : "preLink";
                }
                excuter = excuter || openLink;

                //检查特殊窗口
                let c = checkDefinedNext(undefined, true);
                if (c == 1) {
                    excuter();
                    log("time1:" + (new Date().getTime() - time))
                    return;
                } else if (c == -1)return;

                if (!current.found) {
                    checkNext();
                }
                if (current.found) {
                    excuter();
                    log("time2:" + (new Date().getTime() - time))
                }
                else {
                    checkNextInIframe();
                    if (current.found) {
                        log("time3:" + (new Date().getTime() - time))
                        excuter();
                    }
                }
            }
            this.prev = function() {
                this.next(false);
            };
            this.first = function(isLast) {
                let mark = isLast ? "lastLink" : "firstLink";
                this.next(undefined, undefined, mark);
            }
            this.last = function() {
                this.first(true)
            }

//-----------------------------------------------------------------------------------
//预读 如果是延迟加载的,所以就不能省略参数
            this.next4prefetch = function(win, isForce) {
        try {
                    if (config.prefetchMode < 2)return;
                    win = win || content;
                    current = next;
                    current.dir = "nextLink";
                    excuter = prefetch;
                    cleanTimer(win);
                    let max = config.prefetchMax;
                    if (max == 0) {
                        if (win != content && !isForce)
                            return;
                    }
                    //检查特殊窗口
                    let c = checkDefinedNext(win);
                    if (c == 1) {
                        excuter();
                        return;
                    } else if (c == -1)return;
                    //检查主文档
                    checkLinks(win);
                    if (current.found) {
                        log("found")
                        excuter();
                    }
                    //todo 检查frame
               } catch(e) {
                    log("error:next4prefetch:"+e)
                }
            }

            function prefetch() {
                log("start prefetch")
                let linkNode = current.link;
                let win = current.win;

                fix4Discuz(win);
                if (isGoAsLink()) {
                    //直接打开链接的方式,这种方式之所以优先,是可能会利用到history
                    if (loadFromHistory(true)) {
                        return;
                    }
                    //不能使用iframe的,和强制使用模式1的
                    if (rule.disableIframe.some(isMatch, win)) {
//                xhrPrefetch();
                        iframePrefetch();

                    }
                    else {
                        log("start iframe prefetch")
                        iframePrefetch();
                    }
                    cleanVariable();
                }
                else {
                    //todo 点击方式下的预读
                }
            }

            function xhrPrefetch() {
                log("xhr loading")
                let linkNode = current.link;
                let win = current.win;

                function XRLoaded() {
                    log("xhr loaded")
                    if (this.readyState != 4)return;
                    var str = this.responseText;
                    var images = str.replace(/[\n\r]/ig, '').match(/<img.*?src\s*=\s*"[^"]*"/ig);
                    if (!images)return;
                    var i,ii,src,j,jj,img,isexist;
                    var dimages = [];
                    for (i = 0,ii = images.length; i < ii; i++) {
                        src = images[i].match(/src\s*=\s*"([^"]*)"/i)[1];
                        //跳过src一样的图片...
                        for (j = 0,jj = dimages.length; j < jj; j++) {
                            if (src == dimages[j]) {
                                isexist = true;
                                break;
                            }
                        }
                        if (isexist) {
                            isexist = false;
                            continue;
                        }
                        img = new Image();
                        img.src = src;
                        dimages.push(src);
                    }
                }

                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = XRLoaded;
                xhr.open("GET", linkNode.href, true);
                //xhr.open("GET",'http://www.baidu.com',true);
                //解决乱码
                xhr.overrideMimeType('text/html; charset=' + win.document.characterSet);
                try {
                    xhr.send(null);
                } catch(err) {
                    if (err.message.toLowerCase().indexOf('security') != -1) {
                        //todo 有安全限制的话,采用iframe方式
                    }
                }
            }

            function iframePrefetch() {
                let linkNode = current.link;
                let win = current.win;
                let doc = win.document;

                let browser = gBrowser.getBrowserForDocument(doc);
                if (!browser || !browser.prefetchIframe)return;
                //如果地址相同,放弃加载
                if (browser.prefetchIframe.src == linkNode.href)return;
                //两个地址都要改?mdc是按照第二个写的,真正有效的也是第二个,第一个是以后用来比较用的
                browser.prefetchIframe.src = linkNode.href;
                browser.prefetchIframe.contentDocument.location.href = linkNode.href;
                log("prefetching")
                //?必要吗
//        content.history.replaceState({fromPrefetch:true}, doc.title, doc.location.href);
//        browser.oldPages[getCurrentHref(win)] = win.document.documentElement;
            }

            function loadFromPrefetch() {
                //这两种情况是不必清除的
                if (config.prefetchMode < 2)return false;
                //r如果小于4,就不是用替换的方式
                //if (config.version < 4)return false;
                if (current.dir != "nextLink")return false;

                let frame = gBrowser.selectedBrowser.prefetchIframe;
                if (!frame)return false;

                let linkNode = current.link;
                let root = content.document;
                try {
                    let doc = frame.contentDocument;
                    let node = doc.documentElement;
                    let isLoad = isLoaded(doc);
                    if (!isLoad)return false;
//            if (frame.src == "about:blank")return false;
                    if (rule.disableIframe.some(isMatch, content))return false;
                    //可能可能会保留有旧数据的
                    if (linkNode.href != frame.src)return false;
                    //90ms
                    //node = root.importNode(node, true);
                    //接近200ms
                    //root.replaceChild(node, root.documentElement);

                    //70ms以内,性能好很多,上面的方法更安全和标准,这部分还是有些变化,之前replace更快一些
                    root.documentElement.innerHTML = node.innerHTML;
                    //需要手动把页面调整到顶部
                    content.scrollTo(0, 0);

                    //将目标页面的信息加入历史,10ms
                    content.history.pushState({fromPrefetch:true}, doc.title, doc.location.href);
//            gBrowser.selectedBrowser.oldPages[getCurrentHref()] = content.document.documentElement;
                    cleanVariable();
                    //因为不会触发加载完成的事件,所以必须手动的启动预读
                    setTimeout(function() {
                        log("start prefetch from prefetch")
                        //因为content会随着切换tab发生变化,而这个执行又是有延迟的,所以,必须明确指定才可以,不是content哦
                        nextPage.next4prefetch(root.defaultView, config.prefetchContinue);
                    }, config.prefetchDelay * 1000);
                } catch(e) {
                    log("prefetch sth wrong:" + e)
                    return false;
                } finally {
                    cleanFrame(content)
                }
                return true;
            }

            function cleanFrame(win) {
                try {
                    let browser = gBrowser.getBrowserForDocument(win.document);
                    browser.prefetchIframe.src = "about:blank";
                    browser.prefetchIframe.contentDocument.location.href = "about:blank";
                    browser.prefetch4Sel = false;
                } catch(e) {
                }
            }

            function cleanTimer(win) {
                try {
                    if (config.prefetchAfterLoad || config.prefetchMode < 2)return;
                    let browser = gBrowser.getBrowserForDocument(win.document);
                    //不可能啦,同时只可能有一个timer啦
                    clearTimeout(browser.prefetchTimer);
                    //这里必须直接设置,不能用上面的timer,因为是简单类型,按值传递的
                    gBrowser.getBrowserForDocument(win.document).prefetchTimer = null;
                } catch(e) {
                }
            }

            //对于load来说,只有complete才是完成的状态,对于dom来说,interactive和complete都是完成了
            function isLoaded(doc, state) {
                if (state && state == "load")
                    return doc.readyState == "complete";
                else return /interactive|complete/i.test(doc.readyState);
            }

            function timeStart(name) {
                nextPage.timeList = nextPage.timeList || [];
                nextPage.timeList[name] = new Date().getTime();
            }

            function timeEnd(name) {
                log(new Date().getTime() - nextPage.timeList[name])
            }

            function createButton(checked) {
                let bar = document.getElementById("status-bar");
                let panel = document.createElement("statusbarpanel");
                panel.setAttribute("id", "nextPagePanel");
                let box = document.createElement("checkbox");
                box.setAttribute("id", "nextPageSwitch");
                box.setAttribute("label", config.prefetchSwitcherLabel);
                box.setAttribute("tooltiptext", "prefetch switcher");
                box.setAttribute("onclick", "nextPage.switchPrefetch()")
                box.setAttribute("checked", checked);
                panel.appendChild(box);
                bar.appendChild(panel)
            }

            this.switchPrefetch = function() {
                let box = document.getElementById("nextPageSwitch");
                config.prefetchMode = box.checked ? 0 : 2;
                //prefetch?
            }

//-----------------------------------------------------------------------------------
            this.init = function() {
                if (document.location.href != "chrome://browser/content/browser.xul")return;
                //构建完整的上一页,下一页的正则
                //之前的方式是,每个规则一个正则,现在是整个组成一个正则,实际测试了一下,感觉差不多少,也就是差几个毫秒罢了
                let combine = function(next) {
                    let texts = next.texts;
                    next.fullRegExp = new RegExp(next.startRegexp.toString().slice(1, -1)
                            + "(" + texts.join("|") + ")" + next.endRegexp.toString().slice(1, -1), 'i');
                }
                combine(next);
                combine(previous);
                combine(last);
                combine(first);
                //init
                config.version = getVersion();
                if (config.version < 4)config.prefetchMode = 0;
                if (config.prefetchMode == 2) config.useHistory = false;
                let text = config.prefetchAfterLoad ? "load" : "DOMContentLoaded";
                window.addEventListener("unload", nextPage.uninit, false);
                //prefetch
                if (config.prefetchMode == 2) {
                    let createIframe = function(id) {
                        let frame = document.createElement("iframe");
                        if (id)
                            frame.setAttribute("id", id);
                        frame.setAttribute("type", "content");
                        //iframe是没有history的
                        frame.setAttribute("collapsed", "true");
                        //frame.setAttribute('style', 'display: none;');
                        //不append就没有webnavigation
                        document.documentElement.appendChild(frame);
                        frame.webNavigation.allowAuth = config.prefetch_auth;
                        frame.webNavigation.allowImages = config.prefetch_images;
                        frame.webNavigation.allowJavascript = config.prefetch_javascript;
                        frame.webNavigation.allowMetaRedirects = config.prefetch_redirect;
                        frame.webNavigation.allowPlugins = config.prefetch_plugins;
                        frame.webNavigation.allowSubframes = config.prefetch_subframes;
                        frame.addEventListener("load", function (event) {
                            try {
                                let doc = event.originalTarget;
                                if (doc.location.href == "about:blank" || doc.defaultView.frameElement) return;
                                log("prefetch:loaded:" + doc.readyState)
                            } catch(e) {
                            }
                        }, true);
                        frame.addEventListener("DOMContentLoaded", function (event) {
                            try {
                                let doc = event.originalTarget;
                                if (doc.location.href == "about:blank" || doc.defaultView.frameElement) return;
                                log("prefetch:domloaded:" + doc.readyState)

                            } catch(e) {
                            }
                        }, true);
                        return frame;
                    }
                    let boundData = function(browser) {
                        browser.prefetchIframe = createIframe();
                        /*browser.oldPages = [];
                         let win = browser.contentWindow;
                         getUnsafeWindow(win).onpopstate = function(e) {
                         if (!e.state) {
                         return;
                         }
                         let node = browser.oldPages[getCurrentHref(win)];
                         if (node) {
                         let doc = win.document;
                         doc.replaceChild(node, doc.documentElement)
                         }
                         }*/
                    }

                    boundData(gBrowser.selectedBrowser);
                    gBrowser.tabContainer.addEventListener("TabOpen", function(event) {
                        let browser = gBrowser.getBrowserForTab(event.target);
                        boundData(browser);
                    }, false);
                    gBrowser.tabContainer.addEventListener("TabSelect", function(event) {
                        let browser = gBrowser.getBrowserForTab(event.target);
                        if (browser.prefetch4Sel)return;
                        if (!browser.prefetchTimer && isLoaded(browser.contentDocument, text)) {
                            log("~prefetch 4 tab sel");
                            /*
                             setTimeout(function() {
                             if (!browser.prefetchTimer && isLoaded(browser.contentDocument, text)) {
                             */
                            nextPage.next4prefetch(browser.contentWindow);
                            /* }
                             }, config.prefetchDelay * 1000 / 2)*/
                            browser.prefetch4Sel = true;
                        }
                    }, false);
                    gBrowser.tabContainer.addEventListener("TabClose", function(event) {
                        let browser = gBrowser.getBrowserForTab(event.target);
                        let  win = browser.contentWindow;
                        cleanFrame(win);
                        cleanTimer(win);
                        browser.prefetchIframe = null;
                    }, false);

                    gBrowser.addEventListener(text, function(event) {
                        let doc = event.originalTarget;
                        let win = event.originalTarget.defaultView;
                        if (!doc instanceof HTMLDocument)return;
                        if (win.frameElement)return;

                        log("search link 4 prefetch:" + doc.location.href)
                        cleanFrame(win);
                        if (text == "load")
                            nextPage.next4prefetch(win);
                        else {
                            let browser = gBrowser.getBrowserForDocument(doc);
                            //因为是延迟加载,需要将加载过程停掉,把timer清除,后来总是最正确的
                            //之所以要停掉过程,是因为可能会无法满足我设定的延迟.
                            cleanTimer(win);
                            browser.prefetchTimer = setTimeout(function() {
                                nextPage.next4prefetch(win);
                            }, config.prefetchDelay * 1000);
                        }
                    }, true);
                    if (config.prefetchSwitcher)
                    {
                        if(!config.perfetchSwitcherInit)
                        {
                        config.prefetchMode = 0;
                        createButton(false);
                        }else{
                        createButton(true);
                        }
                    }
                }
                //bind key
                if (config.key_use) {
                    if(!config.key_modifiers&&config.key_next=="VK_RIGHT"&&config.key_prev=="VK_LEFT")
                    config.isFix4Discuz = true;

                    let keyset = document.getElementById("mainKeyset");
                    let next = keyset.appendChild(document.createElement("key"));
                    let pre = keyset.appendChild(document.createElement("key"));
                    next.setAttribute("oncommand", "nextPage.next(true);");
                    pre.setAttribute("oncommand", "nextPage.next();");
                    if (config.key_modifiers) {
                        next.setAttribute("modifiers", config.key_modifiers);
                        pre.setAttribute("modifiers", config.key_modifiers);
                    }
                    next.setAttribute("keycode", config.key_next);
                    pre.setAttribute("keycode", config.key_prev);
                }
            }
            //todo uninit
            this.uninit = function() {
                window.removeEventListener("unload", nextPage.uninit, false);
            }
        }

        nextPage.init();