const RVO = require('rvo-js/index.js')
const Simulator = RVO.Simulator
const RVOMath = RVO.RVOMath

import Modal from 'bootstrap/js/dist/modal'
import Player from '../components/player'
import { resize } from '../helpers/canvas'

const COLORS = {
  CYAN: "rgba(0, 255, 208, 1)",
  GREEN: "rgba(0, 255, 0, 1)"
}

window.Obstacle = () => { }

export default {
  mounted() {

    let canvas = document.getElementById('canvas')
    let context = canvas.getContext('2d')
    let data = this.el.dataset

    const video = JSON.parse(data.video)
    console.log(data)
    const player = new Player(video.youtubeID, (event, data) => this.pushEvent(event, data))

    const settingsModal = new Modal(document.getElementById('modal-settings'), {
      backdrop: 'static'
    })

    // create obstacles
    // TODO: Load from database
    const obstacles = [
      [
        { x: 0.3, y: 0 },
        { x: 0.32, y: 0 },
        { x: 0.32, y: 1 },
        { x: 0.3, y: 1 }
      ],
      [
        { x: 0.56, y: 0.3 },
        { x: 0.45, y: 1 }
      ],
      [
        { x: 0.8, y: 0.2 }
      ]
    ]

    Object.assign(this, { canvas, context, data, obstacles, player, settingsModal, video })

    this.render_canvas()
  },

  updated() {

    const { animationFrameRequest, canvas, data, interval, player, simulator, settingsModal, video } = this

    // request an animation frame only when necessary, delete previous frame if in existance.
    if (animationFrameRequest) cancelAnimationFrame(animationFrameRequest)

    this.animationFrameRequest = requestAnimationFrame(() => {



      switch (this.el.dataset.action) {

        case 'play':
          if (data.mode == 'play-video' || data.mode == 'play-annot') player.play()
          else this.pushEvent("control", { action: "playing" })
          break

        case 'pause':
          if (data.mode == 'play-video' || data.mode == 'play-annot') player.pause()
          else if (interval) clearInterval(interval)

          this.pushEvent("ping", { action: "paused", time: player.time })
          break

        case 'stop':
          if (data.mode == 'video' || data.mode == 'original') {
            if (player.time != 0) {
              player.stop()
              this.pushEvent("ping", { action: "paused", time: 0 })
            }
          } else {
            if (interval) clearInterval(interval)
            if (data.mode == 'synthetic')
              this.pushEvent("ping", { action: "prepare-sim", time: 0 })
          }
          break

        case 'backward':
          player.backward();
          this.pushEvent("ping", { action: "paused", time: player.time - 1 })
          break

        case 'forward':
          player.forward();
          this.pushEvent("ping", { action: "paused", time: player.time + 1 })
          break

        case 'playing':
          this.pushEvent("ping", { action: "playing", time: player.time })
          break

        case 'prepare-sim':
          this.prepareSimulation()
          break
      }
    })
  },

  render_canvas(){
    const {canvas, context, get, settingsModal, show_settings, video} = this

    // should be done once in mount but for some reason properties don't persist there
    resize(video.aspectratio, canvas)

    // draw background
    if(get("show_video")){
      context.clearRect(0, 0, canvas.width, canvas.height)
    } else {
      context.fillStyle = "white"
      context.fillRect(0, 0, canvas.width, canvas.height)
    }

    if (get("show_obstacles")) this.draw_obstacles()

    if(get("show_markers")){
      get("show_video") ? this.draw_agents() : this.draw_synth_agents()
    }

    show_settings ? settingsModal.show() : settingsModal.hide()
  },

  get(key){
    console.log(this, key)
    return JSON.parse(this.data[key])
  },

  draw_agents() {
    let { canvas, context, data } = this

    const agents = JSON.parse(data.agents)
    const selected = JSON.parse(data.selected)
    const show_overlay = JSON.parse(data.showOverlay)

    for (let i = 0; i < agents.length; i++) {
      if (show_overlay) context.fillStyle = "black";
      else context.fillStyle = selected == agents[i][0] ? COLORS.CYAN : COLORS.GREEN

      context.beginPath()
      context.arc(
        canvas.width * agents[i][1],
        canvas.height * agents[i][2],
        5,  // radius
        0,
        2 * Math.PI
      )
      context.fill()
    }
  },

  draw_obstacles() {
    const { canvas, context, obstacles } = this

    context.strokeStyle = context.fillStyle = "rgba(255,0,0,0.5)"
    context.lineWidth = 3;

    for (var i = 0; i < obstacles.length; i++){
      const o = obstacles[i]

      if (o.length == 1) {
        // draw single dot
        context.beginPath()
        context.arc(o[0].x * canvas.width, o[0].y * canvas.height, 3, 0, 2 * Math.PI, true)
        context.fill()

      } else if (o.length == 2) {
        // draw line
        context.beginPath()
        context.moveTo(o[0].x * canvas.width, o[0].y * canvas.height)
        context.lineTo(o[1].x * canvas.width, o[1].y * canvas.height)
        context.stroke()

      } else {
        // draw polygon
        context.beginPath()
        context.moveTo(o[0].x * canvas.width, o[0].y * canvas.height)
        for (var j = 1; j < o.length; j++) {
          context.lineTo(o[j].x * canvas.width, o[j].y * canvas.height)
        }
        context.closePath()
        context.fill()
      }
    }
  },

  draw_synth_agents() {

    const { context, simulator } = this

    context.fillStyle = "black"

    for (let i = 0; i < simulator.getNumAgents(); ++i) {

      const pos = simulator.getAgentPosition(i)
      context.beginPath()
      context.arc(
        pos.x,
        pos.y,
        5,  // radius
        0,
        2 * Math.PI
      )
      context.fill()

      if (RVOMath.absSq(simulator.getGoal(i).minus(simulator.getAgentPosition(i))) < RVOMath.RVO_EPSILON) {
        // Agent is within one radius of its goal, set preferred velocity to zero
        simulator.setAgentPrefVelocity(i, 0.0, 0.0)

        // remove agent from simulation
        console.log(simulator)
        simulator.agents.splice(i, 1)
        i--

      } else {
        // Agent is far away from its goal
        // set preferred velocity as unit vector towards agent's goal.
        let v = RVOMath.normalize(simulator.getGoal(i).minus(simulator.getAgentPosition(i)))
        simulator.setAgentPrefVelocity(i, v.x, v.y)
      }
    }

    simulator.run()

    if (simulator.reachedGoal()) {
      // reset simulation
      this.prepareSimulation()
    }
  },

  prepareSimulation() {
    const simulator = new RVO.Simulator()
    window.agentTree = []
    simulator.setTimeStep(0.25)

    simulator.setAgentDefaults(
      this.video.neighbor_dist, // neighbor distance (min = radius * radius)
      this.video.max_neighbors, // max neighbors
      this.video.time_horizon, // time horizon
      this.video.time_horizon_obst, // time horizon obstacles
      this.video.radius, // agent radius
      this.video.max_speed, // max speed
      this.video.velocity, // default velocity for x
      this.video.velocity, // default velocity for y
    )

    // add agents to simulation
    const agents = JSON.parse(this.data.agents)
    const goals = JSON.parse(this.data.agentGoals)
    const w = canvas.width
    const h = canvas.height

    for (let i = 0; i < agents.length; i++) {
      const id = agents[i][0]
      simulator.addAgent()
      simulator.setAgentPosition(i, agents[i][1] * w, agents[i][2] * h)
      simulator.setAgentGoal(i, goals[id][0] * w, goals[id][1] * h)
    }

    // add obstacles to simulation
    for (let i = 0; i < this.obstacles.length; i++) {
      const obst = []
      for (let j = 0; j < this.obstacles[i].length; j++) {
        obst.push(new RVO.Vector2(
          this.obstacles[i][j].x * this.canvas.width,
          this.obstacles[i][j].y * this.canvas.height
        ))
      }
      simulator.addObstacle(obst)
    }

    simulator.processObstacles()

    this.simulator = simulator

    console.log("Prepared Simulation.")

    this.pushEvent("ping", { action: "pause", time: 0 })
  }
}

