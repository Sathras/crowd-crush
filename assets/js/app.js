import CSS from '../css/app.css'

import React from 'react'
import { render } from "react-dom"
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom'
import { Provider } from "react-redux"
import socket from './api' // do not delete!
import store from "./store"
import { Flash, Header, PRoute } from "./components"
import Pages from "./pages"
import { sessionOperations as Session } from "./modules/session"
import { simOperations as Sim } from "./modules/sim"

const RootHtml = ( ) => (
  <Provider store={ store }>
    <BrowserRouter>
      <div>
        <Header />
        <Flash />
        <Switch>
          <Route path="/" exact render={() => (<Redirect to="/about"/>)} />
          <Route path="/about" component={Pages.About} />
          <Route path="/login" component={Pages.Login} />
          <Route path="/simulation/:id" component={Pages.SimulationShow} />
          <Route path="/videos" exact component={Pages.VideoList} />
          <Route path="/videos/:id" component={Pages.VideoShow} />
          {/*
          <Route path="/video/add" component={VideoAddView} />
          */}

          {/* Private Routes (require login) */}
          <PRoute path="/settings" component={Pages.Settings} />

          {/* default 404 if no route matches*/}
          <Route component={Pages.Error} />
        </Switch>
      </div>
    </BrowserRouter>
  </Provider>
);

// render react app
render( <RootHtml />, document.getElementById( "react-root" ) );

// listen for window resizes
let resizeTimeout;
const resize = () => store.dispatch(Sim.resize())
window.addEventListener("resize", () => {
  if(!!resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resize, 200);
});

// configurePublicChannel(store.dispatch)

// setTimeout(() => { console.log(socket.channel('public'))} , 1000)
// store.dispatch(Session.initialize());
