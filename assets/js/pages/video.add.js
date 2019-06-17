import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Form } from 'semantic-ui-react'
import Validator from 'simple-react-validator'
import { toSeconds, parse } from 'iso8601-duration'
import { videoOperations as Video } from '../modules/video'
import { start_request, complete_request } from '../modules/loading'
import { flashOperations as Flash } from '../modules/flash'

class VideoAdd extends Component {

  state = { aspectratio: '', duration: '', title: '', submitted: false, youtubeID: null }
  validator = new Validator({ element: false })

  onInputChange = (_e, { name, value }) => this.setState({ [name]: value })

  changeURL = e => {

    const { start_request, complete_request, warning } = this.props
    const youtubeID = this.youtube_parser(e.target.value)

    if(!youtubeID) return this.setState({ youtubeID: false})

    start_request()

    // check youtube data-api for title and description and update state
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `https://www.googleapis.com/youtube/v3/videos?&id=${youtubeID}&key=${window.youtubeAPIKey}&part=snippet,player,contentDetails&maxHeight=8192`)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.onload = res => {
      switch(xhr.status){
        case 200:
          res = JSON.parse(res.srcElement.response)

          if(res.items.length == 0){
            this.setState( { youtubeID })
            return warning('Could not connect to YouTube to retrieve aspect ratio. You can manually set the aspect ratio and video duration but it is discouraged to do so.')
          }

          const video = res.items[0]
          this.setState({
            aspectratio: video.player.embedWidth / video.player.embedHeight,
            duration: toSeconds(parse(video.contentDetails.duration)),
            title: video.snippet.title,
            youtubeID: video.id
          });
          return complete_request()

        default:
          this.setState( { youtubeID })
          warning('Could not connect to YouTube to retrieve aspect ratio. You can manually set the aspect ratio but it is discouraged to do so.')
      }
    }
    xhr.send();
  }

  reset = () => this.setState({ aspectratio: null, title: null, youtubeID: null })

  onSubmit = () => {
    if(!this.validator.allValid()) return this.setState({ submitted: true })

    const {submitted, ...data } = this.state
    this.props.createVideo(data)
    this.setState({ aspectratio: '', title: '', submitted: false, youtubeID: null })
  }

  youtube_parser = url => {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
  }

  render() {

    const { aspectratio, duration, submitted, title, youtubeID } = this.state

    this.validator.message('aspectratio', aspectratio, 'required|numeric|between:0.1,3,num')
    this.validator.message('duration', duration, 'required|integer|min:1')
    this.validator.message('title', title, 'required|alpha_num_dash_space|between:5,100')
    this.validator.message('youtubeID', youtubeID, 'required|string|size:11', {
      messages: { default: 'Does not seem to be a a valid YouTube URL.'}
    })

    return (
      <Container textAlign='center'>
        <h2>Add Video</h2>
        <Form onSubmit={this.handleSubmit} loading={this.props.loading} noValidate>
          {this.validator.fieldValid('youtubeID')
            ? <div>
                <Form.Input
                  error={submitted && !this.validator.fieldValid('title')}
                  icon='heading'
                  iconPosition='left'
                  label={submitted && this.validator.errorMessages.title || 'Title'}
                  name='title'
                  onChange={this.onInputChange}
                  placeholder='Title'
                  required
                  type='text'
                  value={title}
                />
                <Form.Input
                  disabled={typeof(aspectratio) != 'string'}
                  error={submitted
                    && typeof(aspectratio) == 'string'
                    && !this.validator.fieldValid('aspectratio')}
                  icon='external square alternate'
                  iconPosition='left'
                  label={
                    submitted
                    && typeof(aspectratio) == 'string'
                    && this.validator.errorMessages.aspectratio
                    || 'Aspect Ratio'
                  }
                  name='aspectratio'
                  onChange={this.onInputChange}
                  required
                  placeholder='Aspect Ratio (Width / Height)'
                  type='text'
                  value={aspectratio}
                />
                <Form.Input
                  disabled={typeof(duration) != 'string'}
                  error={submitted
                    && typeof(duration) == 'string'
                    && !this.validator.fieldValid('duration')}
                  icon='external square alternate'
                  iconPosition='left'
                  label={
                    submitted
                    && typeof(duration) == 'string'
                    && this.validator.errorMessages.duration
                    || 'Duration [sec]'
                  }
                  name='duration'
                  onChange={this.onInputChange}
                  required
                  placeholder='Duration [sec]'
                  type='text'
                  value={duration}
                />
                <Form.Input
                  disabled
                  label='Youtube ID'
                  icon='youtube'
                  iconPosition='left'
                  name='youtubeID'
                  required
                  type='text'
                  value={youtubeID}
                />
                <Form.Button content='Create Video' onClick={this.onSubmit} />
              </div>
            : <Form.Input
                error={youtubeID == null ? false : !this.validator.fieldValid('youtubeID')}
                label={this.validator.errorMessages.youtubeID ||
                  'Please start by pasting a valid YouTube video URL...'}
                icon='youtube'
                iconPosition='left'
                name='youtube_url'
                onChange={this.changeURL}
                placeholder='paste YouTube URL'
                type='text'
              />
          }
        </Form>
      </Container>
    );
  }
}

const mapStateToProps = store => ({ loading: store.loading })
const mapDispatchToProps = {
  createVideo: Video.create,
  start_request,
  complete_request,
  warning: Flash.warning
}
export default connect(mapStateToProps, mapDispatchToProps)(VideoAdd);
