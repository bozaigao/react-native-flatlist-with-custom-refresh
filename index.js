import React, { Component } from 'react';
import { Dimensions, ActivityIndicator, Animated, Easing, FlatList, ScrollView, StyleSheet, Text, View, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
const { height, width } = Dimensions.get('window');
class FlatListWithCustomRefresh extends Component {
    constructor(props) {
        super(props);
        this._scrollViewRef = null;
        this.onScrollEndDrag = e => {
            console.log('%c 手指离开======>>>>>>>>', 'color:orange;');
            let target = e.nativeEvent;
            let y = target.contentOffset.y;
            this.dragFlag = false;
            if (y <= this.refreshHeight && y >= 10) {
                this._scrollViewRef.scrollTo({ x: 0, y: this.refreshHeight, animated: true });
            }
            if (this.state.prState) {
                this._scrollViewRef.scrollTo({ x: 0, y: -70, animated: true });
                this.setState({
                    prTitle: '正在刷新数据中..',
                    prLoading: true,
                    prArrowDeg: new Animated.Value(0),
                    prState: 0
                });
                if (this.props.onMyRefresh) {
                    this.props.onMyRefresh(this);
                }
            }
            let offsetY = e.nativeEvent.contentOffset.y;
            let contentSizeHeight = e.nativeEvent.contentSize.height;
            let originScrollHeight = e.nativeEvent.layoutMeasurement.height;
            if (Math.abs(offsetY + originScrollHeight - contentSizeHeight) < 30) {
                this.props.onEndReached && this.props.onEndReached();
            }
        };
        this.onScrollBeginDrag = () => {
            this.setState({
                beginScroll: true
            });
            this.dragFlag = true;
        };
        this._onScroll = event => {
            let target = event.nativeEvent;
            let y = target.contentOffset.y;
            if (this.dragFlag) {
                if (y <= 10) {
                    this.upState();
                }
                else {
                    this.downState();
                }
            }
            else if (y === 0) {
                this.setState({
                    prTitle: '正在刷新数据中..',
                    prLoading: true,
                    prArrowDeg: new Animated.Value(0)
                });
                this.onRefreshEnd();
            }
        };
        this.base64Icon =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAABQBAMAAAD8TNiNAAAAJ1BMVEUAAACqqqplZWVnZ2doaGhqampoaGhpaWlnZ2dmZmZlZWVmZmZnZ2duD78kAAAADHRSTlMAA6CYqZOlnI+Kg/B86E+1AAAAhklEQVQ4y+2LvQ3CQAxGLSHEBSg8AAX0jECTnhFosgcjZKr8StE3VHz5EkeRMkF0rzk/P58k9rgOW78j+TE99OoeKpEbCvcPVDJ0OvsJ9bQs6Jxs26h5HCrlr9w8vi8zHphfmI0fcvO/ZXJG8wDzcvDFO2Y/AJj9ADE7gXmlxFMIyVpJ7DECzC9J2EC2ECAAAAAASUVORK5CYII=';
        this.dragFlag = false;
        this.refreshHeight = 60;
        this.prStoryKey = 'prtimekey';
        this.state = {
            showLoadIndicator: false,
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
        if (this.props.onMyRefresh) {
            this.setState({
                prTitle: '正在刷新数据中..',
                prLoading: true,
                prArrowDeg: new Animated.Value(0)
            });
            this.timer = setTimeout(() => {
                this._scrollViewRef && this._scrollViewRef.scrollTo({ x: 0, y: this.refreshHeight, animated: true });
                this.timer && clearTimeout(this.timer);
            }, 1000);
        }
    }
    componentWillUnmount() {
        this.timer && clearTimeout(this.timer);
        this.initScrollViewRefresh && this.initScrollViewRefresh.remove();
    }
    renderIndicatorContent() {
        let jsx = [this.renderRefreshContent()];
        return (<View style={{
            width,
            height: this.refreshHeight
        }}>
                {jsx.map((item, index) => {
            return <View key={index}>{item}</View>;
        })}
            </View>);
    }
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
            jsxarr.push(<ActivityIndicator style={indicatorStyle} animated={true} color={'#488eff'}/>);
        }
        else {
            jsxarr.push(null);
        }
        if (!this.state.prLoading) {
            jsxarr.push(<Animated.Image style={arrowStyle} resizeMode={'contain'} source={{ uri: this.base64Icon }}/>);
        }
        else {
            jsxarr.push(null);
        }
        jsxarr.push(<Text style={styles.prState}>{this.state.prTitle}</Text>);
        return (<View style={{ alignItems: 'center' }}>
                <View style={styles.indicatorContent}>
                    {jsxarr.map((item, index) => {
            return <View key={index}>{item}</View>;
        })}
                </View>
                <Text style={styles.prText}>上次更新时间：{this.state.prTimeDisplay}</Text>
            </View>);
    }
    onRefreshEnd() {
        let now = new Date().getTime();
        this.setState({
            prTitle: '下拉可以刷新',
            prLoading: false,
            beginScroll: false,
            prTimeDisplay: dateFormat(now, 'yyyy-MM-dd hh:mm')
        });
        AsyncStorage.setItem(this.prStoryKey, now.toString());
        this._scrollViewRef.scrollTo({ x: 0, y: this.refreshHeight, animated: true });
    }
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
    showLoading() {
        console.log('显示加载进度');
        this.setState({ showLoadIndicator: true });
    }
    hideLoading() {
        console.log('隐藏加载进度');
        this.setState({ showLoadIndicator: false });
    }
    render() {
        let { showLoadIndicator } = this.state;
        return (<ScrollView ref={(scrollView) => {
            this._scrollViewRef = scrollView;
            return this._scrollViewRef;
        }} bounces={true} removeClippedSubviews={false} scrollEventThrottle={16} onScroll={this._onScroll} onScrollEndDrag={this.onScrollEndDrag} onScrollBeginDrag={this.onScrollBeginDrag} onMomentumScrollEnd={e => {
            let offsetY = e.nativeEvent.contentOffset.y;
            let contentSizeHeight = e.nativeEvent.contentSize.height;
            let originScrollHeight = e.nativeEvent.layoutMeasurement.height;
            if (Math.abs(offsetY + originScrollHeight - contentSizeHeight) < 30) {
                this.props.onEndReached && this.props.onEndReached();
            }
        }}>
                {this.renderIndicatorContent()}
                <View style={{ width: '100%' }} onLayout={(e) => {
            console.log('组件挂载', e.nativeEvent.layout.height);
            if (e.nativeEvent.layout.height && e.nativeEvent.layout.height < height) {
                this.viewRef && this.viewRef.setNativeProps({ style: { height: height - e.nativeEvent.layout.height } });
            }
            else {
                this.viewRef && this.viewRef.setNativeProps({ style: { height: 0 } });
            }
        }}>
                    {<FlatList {...this.props} onEndReached={() => {
        }}/>}
                    {showLoadIndicator ? <View style={{
            width: '100%',
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f6f9fc'
        }}>
                                {<View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <ActivityIndicator style={{
            width: 16,
            height: 16
        }} color={'gray'}/>
                                        <Text style={{ marginLeft: 10, color: 'gray' }}>数据加载中...</Text>
                                    </View>}
                            </View> :
            null}
                </View>
                <View ref={ref => {
            this.viewRef = ref;
        }} style={{ width: '100%' }}/>
            </ScrollView>);
    }
}
const dateFormat = function (dateTime, fmt) {
    let date = new Date(dateTime);
    let tmp = fmt || 'yyyy-MM-dd';
    let o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'h+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds()
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
//# sourceMappingURL=index.js.map