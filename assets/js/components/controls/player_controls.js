import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Menu } from 'semantic-ui-react'
import { playerOperations, playerSelectors as Player } from '../../modules/player'
import { OverlayItem } from '../menus'

const PlayerControls = ({ loaded, play, pause, playing, stop }) => (loaded &&
  <Menu.Menu>
    {playing
      ? <Menu.Item icon='pause' onClick={() => pause()}/>
      : <Menu.Item icon='play' onClick={() => play()}/>
    }
    <Menu.Item icon='stop' onClick={() => stop()} />
    <OverlayItem />
  </Menu.Menu>
)

const mapStateToProps = store => ({
  loaded: Player.loaded(store),
  playing: Player.playing(store)
})

const mapDispatchToProps = {
  play: playerOperations.play,
  pause: playerOperations.pause,
  stop: playerOperations.stop
}

export default connect(mapStateToProps, mapDispatchToProps)(PlayerControls)