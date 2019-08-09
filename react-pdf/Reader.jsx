import React, { Component } from 'react'
import { render } from 'react-dom'
import { Page, setOptions, Document } from 'react-pdf'
import raf, { cancel } from 'raf'
import './Reader.less'

const ReactContainer = document.querySelector('#react-container')

setOptions({
  workerSrc:
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.0.305/pdf.worker.min.js',
  disableWorker: false,
  cMapUrl: 'https://github.com/mozilla/pdfjs-dist/raw/master/cmaps/',
  cMapPacked: true,
})

class Reader extends Component {
  state = {
    numPages: null,
    currentPage: 1,
    ready: true,
    pageLoaded: false,
    pageRendered: false,
    getText: false,
    loading: true,
  }
  __zoomEvent = false

  pageRefs = new Map()

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({
      numPages,
      loading: false
    })
  }

  onError = error =>
    window.alert('Error while loading document! \n' + error.message)

  cache = pageKey => {
    if (!this.pageImgs.has(pageKey)) {
      this.pageImgs.set(
        pageKey,
        this.pageRefs.get(pageKey).children[0].toDataURL('image/png'),
      )
    }
  }

  renderLoader = () => (
    <div
      style={{
        width: window.innerWidth,
        height: window.innerHeight,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <p style={{ color: '#fff' }}>Loading...</p>
    </div>
  )

  renderImage = pageNumber => (
    <img src={this.pageImgs.get(pageNumber)} style={{ width: '100%' }} />
  )

  onPageReadyToCache = pageStatus => {
    this.__zoomEvent = false
    const { pageLoaded, pageRendered, getText, currentPage } = this.state
    const newValue = { pageLoaded, pageRendered, getText, ...pageStatus }
    if (newValue.pageLoaded && newValue.pageRendered && newValue.getText) {
      this.cache(currentPage)
      this.setState({ cached: true })
    } else {
      this.setState({ cached: false, ...pageStatus })
    }
  }

  renderPage = pageNumber => {
    const w = parseInt(document.getElementById("sw").value)
    return (
      <Page
        loading={' '}
        inputRef={ref => ref && this.pageRefs.set(pageNumber, ref)}
        key={`page_${pageNumber}`}
        pageNumber={pageNumber}
        onLoadError={this.onError}
        onRenderError={this.onError}
        renderAnnotations={false}
        onGetTextError={this.onError}
        onRenderSuccess={() => this.onPageReadyToCache({ pageRendered: true })}
        onGetTextSuccess={() => this.onPageReadyToCache({ getText: true })}
        width={w}
      />
    )
  }

  render() {
    const { numPages, currentPage, cached, ready, loading } = this.state
    const { file } = this.props
    const pages = [];
    for (let i = 1; i <= numPages; i++) {
      pages.push(i);
    }
    return (
      <div className="Reader">
        <div className="Reader__container">
          <div className="Reader__container__document">
            <Document
              loading={' '}
              inputRef={ref => (this._doc = ref)}
              file={file}
              onLoadSuccess={this.onDocumentLoadSuccess}
              onLoadError={this.onError}
              onSourceError={this.onError}
            >
              {pages.map(i => this.renderPage(i))}
            </Document>
          </div>

          {loading && this.renderLoader()}
        </div>
      </div>
    )
  }
}

const tagData = document.querySelector('#file')
const file = tagData.getAttribute('data-file')
render(<Reader file={file} />, ReactContainer)
