import React, { Component } from 'react'
import {
  View,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { WebView } from 'react-native-webview'

function viewerHtml(base64: string, bundle: string): string {
  return `
    <!DOCTYPE html>
    <html>
     <head>
       <title>PDF reader</title>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     </head>
     <body>
       <input type="hidden" id="sw" value="${Dimensions.get('window').width}" />
       <div id="file" data-file="${base64}"></div>
       <div id="react-container"></div>
       <script type="text/javascript">${bundle}</script>
     </body>
    </html>
  `
}

let htmlForPDF = '';

async function writeWebViewReaderFileAsync(data: string): Promise<*> {
  const bundleContainer = require('./bundleContainer')
  htmlForPDF = viewerHtml(data, bundleContainer.getBundle())
}

function readAsTextAsync(mediaBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onloadend = e => {
        if (typeof reader.result === 'string') {
          return resolve(reader.result)
        }
        return reject(
          `Unable to get result of file due to bad type, waiting string and getting ${typeof reader.result}.`,
        )
      }
      reader.readAsDataURL(mediaBlob)
    } catch (error) {
      reject(error)
    }
  })
}

async function fetchPdfAsync(source: Source): Promise<string> {
  const mediaBlob = await urlToBlob(source)
  return readAsTextAsync(mediaBlob)
}

async function urlToBlob(source: Source) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest()
    xhr.onerror = reject
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        resolve(xhr.response)
      }
    }

    xhr.open('GET', source.uri)

    if (source.headers && Object.keys(source.headers).length > 0) {
      Object.keys(source.headers).forEach((key) => {
        xhr.setRequestHeader(key, source.headers[key]);
      });
    }

    xhr.responseType = 'blob'
    xhr.send()
  })
}

const Loader = () => (
  <View style={{ flex: 1, justifyContent: 'center' }}>
    <ActivityIndicator size="large" />
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  webview: {
    flex: 1,
    backgroundColor: 'rgb(82, 86, 89)',
  },
})

type Source = {
  uri?: string,
  base64?: string,
  ios: boolean,
  data?: string,
  headers: { [key: string]: string }
}

type Props = {
  source: Source,
  style: object,
  webviewStyle: object,
}

type State = {
  ready: boolean,
  type: string,
  data?: string,
}

class PdfReader extends Component<Props, State> {
  state = {
    ready: false,
    data: undefined,
    type: null,
    android: false,
    ios: false,
  }

  async init() {
    const { onLoad } = this.props;
    try {
      const { source } = this.props
      let ready = false
      let data = undefined
      const ios = Platform.OS === 'ios'
      const android = Platform.OS === 'android'

      this.setState({ ios, android })

      if (
        source.uri &&
        (source.uri.startsWith('http') ||
          source.uri.startsWith('file') ||
          source.uri.startsWith('content'))
      ) {
        data = source.uri
        ready= !!data
        type = 'uri'
      } else if (source.base64 && source.base64.startsWith('data')) {
        data = source.base64
        ready = true
        type = 'html'
        await writeWebViewReaderFileAsync(data)
      } else {
        alert('source props is not correct')
        return
      }

      if(onLoad && ready === true) {
        onLoad();
      }

      this.setState({ ready, data })
    } catch (error) {
      alert('Sorry, an error occurred.')
      console.error(error)
    }
  }

  componentDidMount() {
    this.init()
  }

  render() {
    const { ready, data, ios, android } = this.state
    const { style, webviewStyle  } = this.props
    let scaleProp = {}
    if (android) {
      scaleProp = {
        scalesPageToFit: false,
      }
    }

    if (ready && data) {
      return (
        <View style={[styles.container, style]}>
          <WebView
            originWhitelist={['http://*', 'https://*', 'file://*', 'data:*']}
            style={[styles.webview, webviewStyle]}
            source={{ [type]: type === 'html' ? htmlForPDF : data }}
            {...scaleProp}
          />
        </View>
      )
    }

    return <Loader />
  }
}

export default PdfReader
