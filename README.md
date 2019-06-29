# react-native-flatlist-with-custom-refresh
### 安装
直接执行npm install react-native-flatlist-with-custom-refresh --save

### 使用方法
flatlist官方组件的属性和方法通用，只是增加了刷新组件添加了上拉加载事件而已
```javascript
  import FlatListWithCustomRefresh from 'FlatListWithCustomRefresh';

  <FlatListWithCustomRefresh
                          ref={ref => (this.refFlatList = ref)}
                          onMyRefresh={() => {
                              console.log('下拉刷新--->>');
                              this.refresh();
                          }}
                          style={[bgColor(commonStyles.pageDefaultBackgroundColor)]}
                          onEndReached={() => {
                          console.log('上拉加载--->>');
                              this.loadMore();
                          }}
                          //@ts-ignore
                          keyExtractor={(item, index) => index.toString()}
                          scrollEventThrottle={16}
                          onEndReachedThreshold={0.1}
                          data={sourceData}
                          ListEmptyComponent={resFlag && <NodataHomepage/>}
                          ListHeaderComponent={
                              <View>
                                  {plateList.map((val, index) => {
                                      return (
                                          <View key={index}>
                                              <PageuiType navigation={navigation} data={val}/>
                                          </View>
                                      );
                                  })}
                              </View>
                          }
                          ListFooterComponent={this.state.showFooter ? <FooterView/> : <View style={[h(6)]}/>}
                          renderItem={({item, index}) => this.rowRenderer(item, index)}
                      />
```

### iOS效果图
![iOS效果图](./iOS.png)

### Android效果图
![Android效果图](./Android.jpeg)
