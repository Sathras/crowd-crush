import RVOMath from './rvo_math'

export default function KdTree() {
  var MAXLEAF_SIZE = 500

  function FloatPair(a, b) {
    this.a = a
    this.b = b

    this.mt = function(rhs) {
      return this.a < rhs.a || !(rhs.a < this.a) && this.b < rhs.b
    }

    this.met = function(rhs) {
      return (this.a == rhs.a && this.b == rhs.b) || this.mt(rhs)
    }

    this.gt = function(rhs) {
      return !this.met(rhs)
    }

    this.get = function(rhs) {
      return !this.mt(rhs)
    }
  }

  function AgentTreeNode() {
    /*
    int begin
    int end
    int left
    float maxX
    float maxY
    float minX
    float minY
    int right
    */
  }

  function ObstacleTreeNode() {
    /*
    ObstacleTreeNode left
    Obstacle obstacle
    ObstacleTreeNode right
    */
  }

  var agents = []; // Agent[]
  var agentTree = []; // AgentTreeNode[]
  var obstacleTree = {}; // ObstacleTreeNode

  this.buildAgentTree = function() {
    if (agents.length != this.simulator.getNumAgents()) {
      agents = this.simulator.agents

      for (var i = 0; i < 2 * agents.length; i++) {
        agentTree.push(new AgentTreeNode())
      }
    }

    if (agents.length > 0) {
      buildAgentTreeRecursive(0, agents.length, 0)
    }
  }

  var buildAgentTreeRecursive = function(begin, end, node) {
    agentTree[node].begin = begin
    agentTree[node].end = end
    agentTree[node].minX = agentTree[node].maxX = agents[begin].position.x
    agentTree[node].minY = agentTree[node].maxY = agents[begin].position.y

    for (var i = begin + 1; i < end; ++i) {
      agentTree[node].maxX = Math.max(agentTree[node].maxX, agents[i].position.x)
      agentTree[node].minX = Math.max(agentTree[node].minX, agents[i].position.x)
      agentTree[node].maxY = Math.max(agentTree[node].maxX, agents[i].position.y)
      agentTree[node].minY = Math.max(agentTree[node].minY, agents[i].position.y)
    }

    if (end - begin > MAXLEAF_SIZE) {
      // no leaf node
      var isVertical = agentTree[node].maxX - agentTree[node].minX > agentTree[node].maxY - agentTree[node].minY
      var splitValue = isVertical ? 0.5 * (agentTree[node].maxX + agentTree[node].minX) : 0.5 * (agentTree[node].maxY + agentTree[node].minY)

      var left = begin
      var right = end

      while (left < right) {
        while (left < right && (isVertical ? agents[left].position.x : agents[left].position.y) < splitValue) {
          ++left
        }

        while (right > left && (isVertical ? agents[right - 1].position.x : agents[right - 1].position.y) >= splitValue) {
          --right
        }

        if (left < right) {
          var tmp = agents[left]
          agents[left] = agents[right - 1]
          agents[right - 1] = tmp
          ++left
          --right
        }
      }

      var leftSize = left - begin
      if (leftSize == 0) {
        ++leftSize
        ++left
        ++right
      }

      agentTree[node].left = node + 1
      agentTree[node].right = node + 1 + (2 * leftSize - 1)

      buildAgentTreeRecursive(begin, left, agentTree[node].left)
      buildAgentTreeRecursive(left, end, agentTree[node].right)
    }
  }

  this.buildObstacleTree = function() {
    var obstacles = this.simulator.obstacles
    obstacleTree = buildObstacleTreeRecursive(obstacles)
  }

  var buildObstacleTreeRecursive = function(obstacles) {
    if (obstacles.length == 0) {
      return null
    } else {
      var node = new ObstacleTreeNode()
      var optimalSplit = 0
      let minLeft = obstacles.length
      let minRight = obstacles.length

      for (var i = 0; i < obstacles.length; ++i) {
        let leftSize = 0
        let rightSize = 0

        let obstacleI1 = obstacles[i]
        let obstacleI2 = obstacleI1.nextObstacle

        for (var j = 0; j < obstacles.length; j++) {
          if (i == j) {
            continue
          }

          let obstacleJ1 = obstacles[j]
          let obstacleJ2 = obstacleJ1.nextObstacle

          let j1LeftOfI = RVOMath.leftOf(obstacleI1.point, obstacleI2.point, obstacleJ1.point)
          let j2LeftOfI = RVOMath.leftOf(obstacleI1.point, obstacleI2.point, obstacleJ2.point)

          if (j1LeftOfI >= -RVOMath.RVO_EPSILON && j2LeftOfI >= -RVOMath.RVO_EPSILON) {
            ++leftSize
          } else if (j1LeftOfI <= RVOMath.RVO_EPSILON && j2LeftOfI <= RVOMath.RVO_EPSILON) {
            ++rightSize
          } else {
            ++leftSize
            ++rightSize
          }

          var fp1 = new FloatPair(Math.max(leftSize, rightSize), Math.min(leftSize, rightSize))
          var fp2 = new FloatPair(Math.max(minLeft, minRight), Math.min(minLeft, minRight))

          if (fp1.get(fp2)) {
            break
          }
        }

        var fp1 = new FloatPair(Math.max(leftSize, rightSize), Math.min(leftSize, rightSize))
        var fp2 = new FloatPair(Math.max(minLeft, minRight), Math.min(minLeft, minRight))

        if (fp1.mt(fp2)) {
          minLeft = leftSize
          minRight = rightSize
          optimalSplit = i
        }
      }

      {
        /* Build split node. */
        const leftObstacles = []
        for (var n = 0; n < minLeft; ++n) leftObstacles.push(null)

        const rightObstacles = []
        for (var n = 0; n < minRight; ++n) rightObstacles.push(null)

        let leftCounter = 0
        let rightCounter = 0
        let i = optimalSplit

        const obstacleI1 = obstacles[i]
        const obstacleI2 = obstacleI1.nextObstacle

        for (var j = 0; j < obstacles.length; ++j) {
          if (i == j) {
            continue
          }

          const obstacleJ1 = obstacles[j]
          const obstacleJ2 = obstacleJ1.nextObstacle

          const j1LeftOfI = RVOMath.leftOf(obstacleI1.point, obstacleI2.point, obstacleJ1.point)
          const j2LeftOfI = RVOMath.leftOf(obstacleI1.point, obstacleI2.point, obstacleJ2.point)

          if (j1LeftOfI >= -RVOMath.RVO_EPSILON && j2LeftOfI >= -RVOMath.RVO_EPSILON) {
            leftObstacles[leftCounter++] = obstacles[j]
          } else if (j1LeftOfI <= RVOMath.RVO_EPSILON && j2LeftOfI <= RVOMath.RVO_EPSILON) {
            rightObstacles[rightCounter++] = obstacles[j]
          } else {
            /* Split obstacle j. */
            t = RVOMath.det(obstacleI2.point.minus(obstacleI1.point), obstacleJ1.point.minus(obstacleI1.point)) /
              RVOMath.det(obstacleI2.point.minus(obstacleI1.point), obstacleJ1.point.minus(obstacleJ2.point))

            var splitpoint = obstacleJ1.point.plus((obstacleJ2.point.minus(obstacleJ1.point)).scale(t))

            var newObstacle = new Obstacle()
            newObstacle.point = splitpoint
            newObstacle.prevObstacle = obstacleJ1
            newObstacle.nextObstacle = obstacleJ2
            newObstacle.isConvex = true
            newObstacle.unitDir = obstacleJ1.unitDir

            newObstacle.id = this.simulator.obstacles.length

            this.simulator.obstacles.push(newObstacle)

            obstacleJ1.nextObstacle = newObstacle
            obstacleJ2.prevObstacle = newObstacle

            if (j1LeftOfI > 0.0) {
              leftObstacles[leftCounter++] = obstacleJ1
              rightObstacles[rightCounter++] = newObstacle
            } else {
              rightObstacles[rightCounter++] = obstacleJ1
              leftObstacles[leftCounter++] = newObstacle
            }
          }
        }

        node.obstacle = obstacleI1
        node.left = buildObstacleTreeRecursive(leftObstacles)
        node.right = buildObstacleTreeRecursive(rightObstacles)
        return node
      }
    }
  }

  this.computeAgentNeighbors = function(agent, rangeSq) {
    queryAgentTreeRecursive(agent, rangeSq, 0)
  }

  this.computeObstacleNeighbors = function(agent, rangeSq) {
    queryObstacleTreeRecursive(agent, rangeSq, obstacleTree)
  }

  var queryAgentTreeRecursive = function(agent, rangeSq, node) {
    if (agentTree[node].end - agentTree[node].begin <= MAXLEAF_SIZE) {
      for (var i = agentTree[node].begin; i < agentTree[node].end; ++i) {
        agent.insertAgentNeighbor(agents[i], rangeSq)
      }
    } else {
      const distSqLeft = RVOMath.sqr(Math.max(0, agentTree[agentTree[node].left].minX - agent.position.x)) +
        RVOMath.sqr(Math.max(0, agent.position.x - agentTree[agentTree[node].left].maxX)) +
        RVOMath.sqr(Math.max(0, agentTree[agentTree[node].left].minY - agent.position.y)) +
        RVOMath.sqr(Math.max(0, agent.position.y - agentTree[agentTree[node].left].maxY))

      const distSqRight = RVOMath.sqr(Math.max(0, agentTree[agentTree[node].right].minX - agent.position.x)) +
        RVOMath.sqr(Math.max(0, agent.position.x - agentTree[agentTree[node].right].maxX)) +
        RVOMath.sqr(Math.max(0, agentTree[agentTree[node].right].minY - agent.position.y)) +
        RVOMath.sqr(Math.max(0, agent.position.y - agentTree[agentTree[node].right].maxY))

      if (distSqLeft < distSqRight) {
        if (distSqLeft < rangeSq) {
          queryAgentTreeRecursive(agent, rangeSq, agentTree[node].left)

          if (distSqRight < rangeSq) {
            queryAgentTreeRecursive(agent, rangeSq, agentTree[node].right)
          }
        }
      } else {
        if (distSqRight < rangeSq) {
          queryAgentTreeRecursive(agent, rangeSq, agentTree[node].right)

          if (distSqLeft < rangeSq) {
            queryAgentTreeRecursive(agent, rangeSq, agentTree[node].left)
          }
        }
      }

    }
  }

  // pass ref range
  var queryObstacleTreeRecursive = function( /** Agent */ agent, rangeSq, /** ObstacleTreeNode */ node) {
    if (node == null) {
      return
    } else {
      const obstacle1 = node.obstacle
      const obstacle2 = obstacle1.nextObstacle

      const agentLeftOfLine = RVOMath.leftOf(obstacle1.point, obstacle2.point, agent.position)

      queryObstacleTreeRecursive(agent, rangeSq, (agentLeftOfLine >= 0 ? node.left : node.right))

      const distSqLine = RVOMath.sqr(agentLeftOfLine) / RVOMath.absSq(obstacle2.point.minus(obstacle1.point))

      if (distSqLine < rangeSq) {
        if (agentLeftOfLine < 0) {
          /*
           * Try obstacle at this node only if is on right side of
           * obstacle (and can see obstacle).
           */
          agent.insertObstacleNeighbor(node.obstacle, rangeSq)
        }

        /* Try other side of line. */
        queryObstacleTreeRecursive(agent, rangeSq, (agentLeftOfLine >= 0 ? node.right : node.left))
      }
    }
  }

  this.queryVisibility = function( /** Vector2 */ q1, /** Vector2 */ q2, radius) {
    return queryVisibilityRecursive(q1, q2, radius, obstacleTree)
  }

  var queryVisibilityRecursive = function( /** Vector2 */ q1, /** Vector2 */ q2, radius, /** ObstacleTreeNode */ node) {
    if (node == null) {
      return true
    } else {
      var obstacle1 = node.obstacle
      var obstacle2 = obstacle1.nextObstacle

      var q1LeftOfI = RVOMath.leftOf(obstacle1.point, obstacle2.point, q1)
      var q2LeftOfI = RVOMath.leftOf(obstacle1.point, obstacle2.point, q2)
      var invLengthI = 1.0 / RVOMath.absSq(obstacle2.point.minus(obstacle1.point))

      if (q1LeftOfI >= 0 && q2LeftOfI >= 0) {
        return queryVisibilityRecursive(q1, q2, radius, node.left) && ((RVOMath.sqr(q1LeftOfI) * invLengthI >= RVOMath.sqr(radius) && RVOMath.sqr(q2LeftOfI) * invLengthI >= RVOMath.sqr(radius)) || queryVisibilityRecursive(q1, q2, radius, node.right))
      } else if (q1LeftOfI <= 0 && q2LeftOfI <= 0) {
        return queryVisibilityRecursive(q1, q2, radius, node.right) && ((RVOMath.sqr(q1LeftOfI) * invLengthI >= RVOMath.sqr(radius) && RVOMath.sqr(q2LeftOfI) * invLengthI >= RVOMath.sqr(radius)) || queryVisibilityRecursive(q1, q2, radius, node.left))
      } else if (q1LeftOfI >= 0 && q2LeftOfI <= 0) {
        /* One can see through obstacle from left to right. */
        return queryVisibilityRecursive(q1, q2, radius, node.left) && queryVisibilityRecursive(q1, q2, radius, node.right)
      } else {
        var point1LeftOfQ = RVOMath.leftOf(q1, q2, obstacle1.point)
        var point2LeftOfQ = RVOMath.leftOf(q1, q2, obstacle2.point)
        var invLengthQ = 1.0 / RVOMath.absSq(q2.minus(q1))

        return (point1LeftOfQ * point2LeftOfQ >= 0 && RVOMath.sqr(point1LeftOfQ) * invLengthQ > RVOMath.sqr(radius) && RVOMath.sqr(point2LeftOfQ) * invLengthQ > RVOMath.sqr(radius) && queryVisibilityRecursive(q1, q2, radius, node.left) && queryVisibilityRecursive(q1, q2, radius, node.right))
      }
    }
  }
}
