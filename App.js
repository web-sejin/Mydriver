import React, {useState, useEffect, useRef} from 'react';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Button,
  Dimensions,
  LogBox,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  useColorScheme,
  View,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import SplashScreen from 'react-native-splash-screen';
import {check, checkMultiple, PERMISSIONS, RESULTS, request, requestMultiple} from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

let pwChgPop = false;

const App = () => {
  const app_domain = "https://cnj0004.cafe24.com";

  const [urls, set_urls] = useState("ss");
  const [appToken, setAppToken] = useState();  
  const [is_loading, set_is_loading] = useState(false);
  const [deviceUnique, setDeviceUnique] = useState();

  const url = app_domain+"?chk_app=Y&app_token=";
  const webViews = useRef();

  let canGoBack = false;
  let timeOut;

  //디바이스 번호
  useEffect(() => {    
    async function requestDevice() {
      DeviceInfo.getUniqueId().then(uniqueId => {
        //console.log(uniqueId);
        setDeviceUnique(uniqueId);
        // iOS: "FCDBD8EF-62FC-4ECB-B2F5-92C9E79AC7F9"
        // Android: "dd96dec43fb81c97"
      });
    }

    requestDevice();
    set_is_loading(true);
  }, [deviceUnique])

  function fnPopState(pop_id, type){
    if(pop_id == "pw_chg_pop"){
      pwChgPop = type;
    }
  }

  //포스트메세지 (웹 -> 앱)
  const onWebViewMessage = (webViews) => {
    let jsonData = JSON.parse(webViews.nativeEvent.data);
    //console.log("jsonData.data : ", jsonData.data);
    if(jsonData.data == "popup"){
      fnPopState(jsonData.pop_id, jsonData.type);
    }
  }

  const onNavigationStateChange = (webViewState)=>{
    set_urls(webViewState.url);

    console.log("webViewState.url : ", webViewState.url);

    pwChgPop = false;

    //웹에 chk_app 세션 유지 위해 포스트메시지 작성
    const chkAppData =JSON.stringify({
      type: "chk_app_token",
      isapp: "Y",
      istoken: appToken,
    });
    //webViews.current.postMessage(chkAppData);
  }

  //뒤로가기 버튼
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();

    //console.log(urls);
  }, [urls]);

  const backAction = () => {
    const app_split = urls.split('?')[0];
    //console.log("@@@@back urls : ", app_split);
    //console.log("@@@@back urls2 : ", urls);
    if(pwChgPop){
      const popOffData =JSON.stringify({ type: "popOff", popId: "pw_chg_pop" });
      webViews.current.postMessage(popOffData);
    }else{
      if (
          app_split == app_domain + '/' ||
          app_split == app_domain ||
          urls == app_domain ||
          urls == app_domain + '/' ||
          urls == app_domain + '/index.php' ||
          urls.indexOf("login.php") != -1 ||
          urls.indexOf("order_list.php") != -1 ||
          urls.indexOf("mypage.php") != -1 ||
          urls.indexOf("setting.php") != -1
      ){     
        if(!canGoBack){ 
          ToastAndroid.show('한번 더 누르면 종료합니다.', ToastAndroid.SHORT);
          canGoBack = true;
          timeOut = setTimeout(function(){
          canGoBack = false;
          }, 2000);
        }else{
          clearTimeout(timeOut);
          BackHandler.exitApp();
          canGoBack = false;
          //const sendData =JSON.stringify({ type:"종료" });
        }
      }else{
        webViews.current.goBack();
      }
    }
    return true;
  };

  return (
    <SafeAreaView style={{flex:1}}>
      {is_loading && deviceUnique ? (
      <WebView
        ref={webViews}
        source={{
          uri: url+deviceUnique,
        }}
        useWebKit={false}
        onMessage={webViews => onWebViewMessage(webViews)}
        onNavigationStateChange={(webViews) => onNavigationStateChange(webViews)}
        javaScriptEnabledAndroid={true}
        allowFileAccess={true}
        renderLoading={true}
        mediaPlaybackRequiresUserAction={false}
        setJavaScriptEnabled = {false}
        scalesPageToFit={true}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        textZoom = {100}
      />
      ) : (
        <View style={{ marginTop: "49%" }}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
