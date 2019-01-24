const Client = require('instagram-private-api').V1
const moment = require('moment')

class InstagramBot {
  constructor (username, password) {
    this.device = new Client.Device(username)
    this.storage = new Client.CookieFileStorage(__dirname + `/cookies/${username}.json`)
    this.username = username
    this.password = password
    this.randomPause = randomPause
  }

  async _getSession () {
    if (!this._session) {
      this._session = await Client.Session.create(this.device, this.storage, this.username, this.password)
    }
    return this._session
  }

  async searchForUser (username) {
    return await Client.Account.searchForUser(await this._getSession(), username)
  }

  async followUser (username) {
    console.log('Following', username)
    const account = await this.searchForUser(username)
    return await Client.Relationship.create(await this._getSession(), account.id)
  }

  async unfollowUser (username) {
    const account = await this.searchForUser(username)
    return await Client.Relationship.destroy(await this._getSession(), account.id)
  }

  async like (mediaID) {
    console.log('Liking', mediaID)
    return await Client.Like.create(await this._getSession(), mediaID)
  }

  async followers () {
    const session = await this._getSession()
    const feed = new Client.Feed.AccountFollowers(session, await session.getAccountId())
    feed.map = item => item._params
    return await feed.all()
  }

  async following () {
    const session = await this._getSession()
    const feed = new Client.Feed.AccountFollowing(session, await session.getAccountId())
    feed.map = item => item._params
    return await feed.all()
  }

  async timeline(){
    const session = await this._getSession()
    const feed = new Client.Feed.Timeline(session, await session.getAccountId())
    feed.map = item => item._params
    return await feed.get()
  }

  async unfollowNotFollowing () {
    const followers = await this.followers()
    const following = await this.following()

    const notFollowingBack = following.filter(following => {
      let isFollowingBack = false
      followers.forEach(follower => {
        if (follower.username === following.username) isFollowingBack = true
      })
      return !isFollowingBack
    })
    if (notFollowingBack.length) {
      const unfollowNumber = Math.ceil(notFollowingBack.length)
      console.log('Numbers', followers.length, following.length, notFollowingBack.length, unfollowNumber)
      for (let i = 0; i < unfollowNumber; i++) {
        const user = notFollowingBack[notFollowingBack.length - 1 - i]
        if (user) {
          try {
            const username = user.username
            console.log('Unfollowing', username)
            await this.unfollowUser(username)
            await randomPause(3)
          } catch (e) {
            console.log('Error unfollowing', user)
          }
        }
      }
    }
  }

  async hashtag (hashtag) {
    const feed = new Client.Feed.TaggedMedia(await this._getSession(), hashtag)
    feed.map = item => item._params
    return await feed.get()
  }

  async userMedia (userId, limit = 5) {
    const feed = new Client.Feed.UserMedia(await this._getSession(), userId, limit)
    const data = feed.get()
    return data.map(item => item._params)
  }

  async myMedia (limit = 10) {
    const session = await this._getSession()
    const feed = new Client.Feed.UserMedia(session, await session.getAccountId(), limit)
    const data = feed.get()
    return data.map(item => item._params)
  }

  async getLikers(mediaId) {
    const session = await this._getSession()
    return new Client.Media.likers(session,mediaId)
  }

  async userLastPostDate(userId) {
    const media = await this.userMedia(userId)
    if(media && media[0]){
      return moment(media[0].takenAt)
    }
  }

  async likeAndFollow (username, mediaId) {
    await this.like(mediaId)
    await randomPause(3)
    await this.followUser(username)
    await randomPause(3)
  }

  async likeAndFollowHashtag (hashtag, maxLike = 100, maxFollow = 60, maxAge = 5) {
    console.log(`Liking and following ${hashtag}`, maxLike, maxFollow)
    let likeCount = 0
    let followCount = 0
    const data = (await this.hashtag(hashtag)).map(hashtag => {
      return {
        mediaId: hashtag._params.id,
        username: hashtag._params.user.username,
        following: hashtag._params.user.friendship_status.following,
        followingPending: hashtag._params.user.friendship_status.outgoing_request,
        likes: hashtag._params.likeCount,
        hasLiked: hashtag._params.hasLiked,
        age: Math.floor(((new Date() - (hashtag._params.deviceTimestamp / 1000)) / 1000) / 60)
      }
    })
    const like = data.filter(item => {return item.following && !item.hasLiked && item.age <= maxAge})
    const likeAndFollow = data.filter(item => {return !item.following && !item.followingPending && !item.hasLiked && item.age <= maxAge})

    if (likeCount < maxLike) {
      for (let media of like) {
        await this.like(media.mediaId)
        likeCount++
        await this.randomPause(3)
      }
    }

    if (followCount < maxFollow) {
      for (let media of likeAndFollow) {
        followCount++
        likeCount++
        await this.likeAndFollow(media.username, media.mediaId)
      }
    }

    return {likeCount, followCount}
  }
}

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const randomPause = seconds => new Promise(resolve => {
  setTimeout(resolve, 1000 * getRandomInt(seconds / 2, seconds * 2))
})

module.exports = InstagramBot