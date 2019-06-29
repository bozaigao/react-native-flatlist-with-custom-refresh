/**
 * @filename Index.tsx
 * @author 何晏波
 * @QQ 1054539528
 * @date 2019/6/12
 * @Description: 基于FlatList封装的下拉刷新上拉加载组件，主要解决在ScrollView嵌套FlatList的情况下使用FlatList自带的刷新组件在Android机
 * 上手势冲突会很卡的问题
 */
import React, {Component} from 'react';
import {
    Dimensions,
    ActivityIndicator,
    Animated,
    AsyncStorage,
    Easing,
    FlatList,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
    DeviceEventEmitter
} from 'react-native';

const {height, width} = Dimensions.get('window');

interface Props {
    onMyRefresh?: any;
    onEndReached?: any;
    style?: any;
}

interface State {
    prArrowDeg: any;
    prLoading: boolean;
    prTitle: string;
    prTimeDisplay: string;
    prState: number;
    beginScroll: boolean;
}

class FlatListWithCustomRefresh extends Component<Props, State> {
    private transform;
    private base64Icon;
    private dragFlag;
    private refreshHeight: number;
    private _scrollViewRef: ScrollView | null = null;
    private prStoryKey;
    private timer;
    private viewRef;
    private initScrollViewRefresh

    constructor(props) {
        super(props);
        this.base64Icon =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAABQBAMAAAD8TNiNAAAAJ1BMVEUAAACqqqplZWVnZ2doaGhqampoaGhpaWlnZ2dmZmZlZWVmZmZnZ2duD78kAAAADHRSTlMAA6CYqZOlnI+Kg/B86E+1AAAAhklEQVQ4y+2LvQ3CQAxGLSHEBSg8AAX0jECTnhFosgcjZKr8StE3VHz5EkeRMkF0rzk/P58k9rgOW78j+TE99OoeKpEbCvcPVDJ0OvsJ9bQs6Jxs26h5HCrlr9w8vi8zHphfmI0fcvO/ZXJG8wDzcvDFO2Y/AJj9ADE7gXmlxFMIyVpJ7DECzC9J2EC2ECAAAAAASUVORK5CYII=';
        //ScrollView是否处于拖动状态的标志
        this.dragFlag = false;
        this.refreshHeight = 60;
        this.prStoryKey = 'prtimekey';
        this.state = {
            prArrowDeg: new Animated.Value(0),
            prLoading: false,
            prTitle: '下拉可以刷新',
            prTimeDisplay: '暂无更新',
            prState: 0,
            beginScroll: false
        };
        this._onScroll = this._onScroll.bind(this);
        this.onScrollEndDrag = this.onScrollEndDrag.bind(this);
        this.onScrollBeginDrag = this.onScrollBeginDrag.bind(this);
    }

    componentDidMount() {
        this.initScrollViewRefresh = DeviceEventEmitter.addListener('initScrollViewRefresh', () => {
            this.onRefreshEnd();
        });
        if (Platform.OS === 'android' && this.props.onMyRefresh) {
            this.setState({
                prTitle: '正在刷新数据中..',
                prLoading: true,
                prArrowDeg: new Animated.Value(0)
            });
            this.timer = setTimeout(() => {
                this._scrollViewRef && this._scrollViewRef.scrollTo({x: 0, y: this.refreshHeight, animated: true});
                this.timer && clearTimeout(this.timer);
            }, 1000);
        }
    }

    componentWillUnmount() {
        this.timer && clearTimeout(this.timer);
        this.initScrollViewRefresh && this.initScrollViewRefresh.remove()
    }

    renderIndicatorContent() {
        let jsx = [this.renderRefreshContent()];

        return (
            <View
                style={
                    Platform.OS === 'ios' ?
                        styles.pullRefresh :
                        {
                            width,
                            height: this.refreshHeight
                        }
                }
            >
                {jsx.map((item, index) => {
                    return <View key={index}>{item}</View>;
                })}
            </View>
        );
    }

    /**
     * @author 何晏波
     * @QQ 1054539528
     * @date 2019/6/12
     * @function: 渲染刷新下拉组件
     */
    renderRefreshContent() {
        this.transform = [
            {
                rotate: this.state.prArrowDeg.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '-180deg']
                })
            }
        ];
        let jsxarr = [];
        let arrowStyle = {
            position: 'absolute',
            width: 14,
            height: 23,
            left: -50,
            top: -4,
            transform: this.transform
        };
        let indicatorStyle = {
            position: 'absolute',
            left: -40,
            top: 2,
            width: 16,
            height: 16
        };

        if (this.state.prLoading) {
            //@ts-ignore
            jsxarr.push(<ActivityIndicator style={indicatorStyle} animated={true} color={'#488eff'}/>);
        } else {
            jsxarr.push(null);
        }
        if (!this.state.prLoading) {
            jsxarr.push(<Animated.Image style={arrowStyle} resizeMode={'contain'} source={{uri: this.base64Icon}}/>);
        } else {
            jsxarr.push(null);
        }
        jsxarr.push(<Text style={styles.prState}>{this.state.prTitle}</Text>);

        return (
            <View style={{alignItems: 'center'}}>
                <View style={styles.indicatorContent}>
                    {jsxarr.map((item, index) => {
                        return <View key={index}>{item}</View>;
                    })}
                </View>
                <Text style={styles.prText}>上次更新时间：{this.state.prTimeDisplay}</Text>
            </View>
        );
    }

    /**
     * @author 何晏波
     * @QQ 1054539528
     * @date 2019/6/12
     * @function: 手指离开
     */
    onScrollEndDrag = e => {

        console.log('%c 手指离开======>>>>>>>>', 'color:orange;',)

        let target = e.nativeEvent;
        let y = target.contentOffset.y;

        this.dragFlag = false;
        if (y <= this.refreshHeight && y >= 10 && Platform.OS === 'android') {
            this._scrollViewRef.scrollTo({x: 0, y: this.refreshHeight, animated: true});
        }
        if (this.state.prState) {
            // 回到待收起状态
            this._scrollViewRef.scrollTo({x: 0, y: -70, animated: true});

            this.setState({
                prTitle: '正在刷新数据中..',
                prLoading: true,
                prArrowDeg: new Animated.Value(0),
                prState: 0
            });

            // 触发外部的下拉刷新方法
            if (this.props.onMyRefresh) {
                this.props.onMyRefresh(this);
            }
        }

        let offsetY = e.nativeEvent.contentOffset.y; //滑动距离
        let contentSizeHeight = e.nativeEvent.contentSize.height; //scrollView contentSize高度
        let originScrollHeight = e.nativeEvent.layoutMeasurement.height; //scrollView高度

        if (Math.abs(offsetY + originScrollHeight - contentSizeHeight) < 30) {
            this.props.onEndReached && this.props.onEndReached();
        }
    };

    /**
     * @author 何晏波
     * @QQ 1054539528
     * @date 2019/6/12
     * @function: 手指未离开
     */
    onScrollBeginDrag = () => {
        this.setState({
            beginScroll: true
        });
        this.dragFlag = true;
    };

    /**
     * @author 何晏波
     * @QQ 1054539528
     * @date 2019/6/12
     * @function: 实时滚动事件
     */
    _onScroll = event => {
        let target = event.nativeEvent;
        let y = target.contentOffset.y;

        if (this.dragFlag) {
            if (Platform.OS === 'ios') {
                if (y <= -70) {
                    this.upState();
                } else {
                    this.downState();
                }
            } else if (Platform.OS === 'android') {
                if (y <= 10) {
                    this.upState();
                } else {
                    this.downState();
                }
            }
        }
        //解决Android用户端迅速拉动列表手指放开的一瞬间列表还在滚动
        else if (y === 0 && Platform.OS === 'android') {
            this.setState({
                prTitle: '正在刷新数据中..',
                prLoading: true,
                prArrowDeg: new Animated.Value(0)
            });
            this.onRefreshEnd();
        }
    };

    /**
     * @author 何晏波
     * @QQ 1054539528
     * @date 2019/6/12
     * @function: 刷新结束
     */
    onRefreshEnd() {
        let now = new Date().getTime();

        this.setState({
            prTitle: '下拉可以刷新',
            prLoading: false,
            beginScroll: false,
            prTimeDisplay: dateFormat(now, 'yyyy-MM-dd hh:mm')
        });
        // 存一下刷新时间
        AsyncStorage.setItem(this.prStoryKey, now.toString());
        if (Platform.OS === 'ios') {
            this._scrollViewRef.scrollTo({x: 0, y: 0, animated: true});
        } else if (Platform.OS === 'android') {
            this._scrollViewRef.scrollTo({x: 0, y: this.refreshHeight, animated: true});
        }
    }

    // 高于临界值状态
    upState() {
        this.setState({
            prTitle: '释放立即刷新',
            prState: 1
        });

        Animated.timing(this.state.prArrowDeg, {
            toValue: 1,
            duration: 100,
            easing: Easing.inOut(Easing.quad)
        }).start();
    }

    // 低于临界值状态
    downState() {
        this.setState({
            prTitle: '下拉可以刷新',
            prState: 0
        });
        Animated.timing(this.state.prArrowDeg, {
            toValue: 0,
            duration: 100,
            easing: Easing.inOut(Easing.quad)
        }).start();
    }

    render() {
        return (
            <ScrollView
                ref={(scrollView: any) => {
                    this._scrollViewRef = scrollView as (ScrollView | null);
                    return this._scrollViewRef;
                }}
                bounces={true}
                removeClippedSubviews={false}
                scrollEventThrottle={16}
                onScroll={this._onScroll}
                onScrollEndDrag={this.onScrollEndDrag}
                onScrollBeginDrag={this.onScrollBeginDrag}
                onMomentumScrollEnd={e => {
                    let offsetY = e.nativeEvent.contentOffset.y; //滑动距离
                    let contentSizeHeight = e.nativeEvent.contentSize.height; //scrollView contentSize高度
                    let originScrollHeight = e.nativeEvent.layoutMeasurement.height; //scrollView高度

                    if (Math.abs(offsetY + originScrollHeight - contentSizeHeight) < 30) {
                        this.props.onEndReached && this.props.onEndReached();
                    }
                }}
            >
                {this.renderIndicatorContent()}
                <View style={{width: '100%'}} onLayout={(e) => {
                    console.log('组件挂载', e.nativeEvent.layout.height);
                    //如果Android端列表数据不够一屏则需要增加空白来进行填充
                    if (e.nativeEvent.layout.height && e.nativeEvent.layout.height < height) {
                        this.viewRef && this.viewRef.setNativeProps({style: {height: height - e.nativeEvent.layout.height}});
                    } else {
                        this.viewRef && this.viewRef.setNativeProps({style: {height: 0}});
                    }
                }}>
                    {
                        //@ts-ignore
                        <FlatList {...this.props} onEndReached={() => {
                        }}/>
                    }
                </View>
                {//如果是Android端则增加一点空白，因为Android ScrollView没有bounce属性，这样才可以进行下拉刷新
                    Platform.OS === 'android' ? (
                        <View
                            ref={ref => {
                                this.viewRef = ref;
                            }}
                            style={{width: '100%'}}
                        />
                    ) : null}
            </ScrollView>
        );
    }
}

const dateFormat = function (dateTime, fmt) {
    let date = new Date(dateTime);

    let tmp = fmt || 'yyyy-MM-dd';
    let o = {
        'M+': date.getMonth() + 1, //月份
        'd+': date.getDate(), //日
        'h+': date.getHours(), //小时
        'm+': date.getMinutes(), //分
        's+': date.getSeconds(), //秒
        'q+': Math.floor((date.getMonth() + 3) / 3), //季度
        S: date.getMilliseconds() //毫秒
    };

    if (/(y+)/.test(tmp)) {
        tmp = tmp.replace(RegExp.$1, String(date.getFullYear()).substr(4 - RegExp.$1.length));
    }
    for (let k in o) {
        if (new RegExp('(' + k + ')').test(tmp)) {
            tmp = tmp.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(String(o[k]).length));
        }
    }
    return tmp;
};

const styles = StyleSheet.create({
    pullRefresh: {
        position: 'absolute',
        top: -69,
        left: 0,
        backfaceVisibility: 'hidden',
        right: 0,
        height: 70,
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    loadMore: {
        height: 35,
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        height: 70,
        backgroundColor: '#fafafa',
        color: '#979aa0'
    },
    prText: {
        marginBottom: 4,
        color: '#979aa0',
        fontSize: 12
    },

    prState: {
        marginBottom: 4,
        fontSize: 12,
        color: '#979aa0'
    },
    lmState: {
        fontSize: 12
    },
    indicatorContent: {
        flexDirection: 'row',
        marginBottom: 5
    }
});

export default FlatListWithCustomRefresh;
