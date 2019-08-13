import React, { Component } from 'react';
import {
  Switch,
  Route,
  withRouter
} from 'react-router-dom';
import Box from '3box';

import { TopicManagerABI } from './utils/constants';

import Cover from './ui/views/Cover';
import Chat from './ui/views/Chat';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      box: {},
      chanSpace: {},
      myAddress: '',
      myProfile: {},
      isAppReady: false,
      topicList: [],
      topicManager: {},
    };
  }

  componentDidMount() {
    const { box } = this.state;
    const { history } = this.props
    if (!box.public) history.push('/');
    this.setState({ isAppReady: true });
  }

  handleLogin = async () => {
    const { history } = this.props
    const addresses = await window.ethereum.enable();
    const myAddress = addresses[0];

    this.updateTopics();

    const box = await Box.openBox(myAddress, window.ethereum, {});
    const myProfile = await Box.getProfile(myAddress);
    const chanSpace = await box.openSpace('3chan');

    this.setState({ chanSpace, box, myProfile, myAddress });
    history.push('/chat');
    await new Promise((resolve, reject) => box.onSyncDone(resolve));
  }

  updateTopics = () => {
    const { topicManager } = this.state;

    let newTopicManager;
    if (!topicManager.topics) {
      newTopicManager = web3.eth.contract(TopicManagerABI).at('0x7f2210557974dD74A660CcC8e2D4233528fb54A4'); // eslint-disable-line
    } else {
      newTopicManager = topicManager;
    }

    const getTopics = (i, err, topic) => {
      if (err) return
      if (topic) this.addToTopicList(topic)
      newTopicManager.topics(i, getTopics.bind(getTopics, ++i));
      this.setState({ topicManager: newTopicManager });
    }

    getTopics(0);
  }

  addToTopicList = (topic) => {
    const { topicList } = this.state;
    const updatedTopicList = topicList.slice();
    updatedTopicList.push(topic);
    this.setState({ topicList: updatedTopicList });
  }

  render() {
    const {
      isAppReady,
      chanSpace,
      topicManager,
      topicList,
      myProfile,
      myAddress
    } = this.state;
    console.log(this.state);
    return (
      <div className="App">
        {isAppReady && (<React.Fragment>

          <Switch>
            <Route
              exact
              path='/'
              render={() => <Cover handleLogin={this.handleLogin} />}
            />

            <Route
              exact
              path='/chat'
              render={() => (
                <Chat
                  chanSpace={chanSpace}
                  myProfile={myProfile}
                  myAddress={myAddress}
                  topicList={topicList}
                  topicManager={topicManager}
                />
              )}
            />
          </Switch>
        </React.Fragment>)}
      </div>
    );
  }
}

export default withRouter(App);