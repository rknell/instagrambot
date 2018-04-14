const InstagramBot = require('./app')
const nodeSchedule = require('node-schedule')

let likeCount = 0
let followCount = 0
const MAX_LIKE = 300/3
const MAX_FOLLOW = 200/3

const unfollowNotFollowing = async () => {
  const instagramBot = new InstagramBot(process.env.USERNAME, process.env.PASSWORD)
  try {
    await instagramBot.unfollowNotFollowing()
  } catch (e) {
    console.error(e)
  }
}

const likeAndFollow = async () => {
  const instagramBot = new InstagramBot(process.env.USERNAME, process.end.PASSWORD)
  try {
    const data = (await instagramBot.hashtag(process.env.HASHTAG)).map(item => {
      return {
        mediaId: item._params.id,
        username: item._params.user.username,
        following: item._params.user.friendship_status.following,
        followingPending: item._params.user.friendship_status.outgoing_request,
        likes: item._params.likeCount,
        hasLiked: item._params.hasLiked,
        age: Math.floor(((new Date() - (item._params.deviceTimestamp / 1000)) / 1000) / 60)
      }
    })
    const like = data.filter(item => {return item.following && !item.hasLiked && item.age <= 5})
    const likeAndFollow = data.filter(item => {return !item.following && !item.followingPending && !item.hasLiked && item.age <= 5})

    if(likeCount < MAX_LIKE){
      for(let media of like){
        await instagramBot.like(media.mediaId)
        likeCount++;
        await instagramBot.randomPause(10)
      }
    }


    if(followCount < MAX_FOLLOW){
      for(let media of likeAndFollow){
        followCount ++;
        await instagramBot.likeAndFollow(media.username, media.mediaId)
      }
    }

  } catch (e) {
    console.error(e)
  } finally {
    if(likeCount < MAX_LIKE && followCount < MAX_FOLLOW){
      console.log("Sleeping")
      await instagramBot.randomPause(60*3)
      likeAndFollow()
    } else {
      //Do nothing
    }
  }
}

const pausePromise = (milliseconds) => new Promise((resolve, reject) => {
  setTimeout(resolve, milliseconds)
})

nodeSchedule.scheduleJob('0 0 6,12,17 ? * * *', ()=>{
  followCount = 0;
  likeCount = 0;
  likeAndFollow()
})

nodeSchedule.scheduleJob('0 0 4 ? * * *', unfollowNotFollowing)

setInterval(()=>{
  //keep alive
}, 1000*60);