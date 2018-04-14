const InstagramBot = require('./app')
const nodeSchedule = require('node-schedule')

let likeCount = 0
let followCount = 0
const MAX_LIKE = Math.ceil(300/3)
const MAX_FOLLOW = Math.ceil(200/3)

const unfollowNotFollowing = async () => {
  const instagramBot = new InstagramBot(process.env.USERNAME, process.env.PASSWORD)
  try {
    await instagramBot.unfollowNotFollowing()
  } catch (e) {
    console.error(e)
  } finally {
    console.log('Unfollow finished, next run', unfollowJob.nextInvocation()._date.format('HH:mm DD/MM'))
  }
}

const likeAndFollow = async () => {
  const instagramBot = new InstagramBot(process.env.USERNAME, process.env.PASSWORD)
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
        await instagramBot.randomPause(3)
      }
    }


    if(followCount < MAX_FOLLOW){
      for(let media of likeAndFollow){
        followCount ++;
        likeCount++;
        await instagramBot.likeAndFollow(media.username, media.mediaId)
      }
    }

  } catch (e) {
    console.error(e)
  } finally {
    if(likeCount < MAX_LIKE && followCount < MAX_FOLLOW){
      console.log("Sleeping", MAX_LIKE-likeCount, MAX_FOLLOW-followCount)
      await instagramBot.randomPause(60*3)
      likeAndFollow()
    } else {
      console.log('Like and follow finished, next run',likeAndFollowJob.nextInvocation()._date.format('HH:mm DD/MM'))
    }
  }
}

const pausePromise = (milliseconds) => new Promise((resolve, reject) => {
  setTimeout(resolve, milliseconds)
})

const likeAndFollowJob = nodeSchedule.scheduleJob('Like and follow','0 39 7,13,18 * * * *', ()=>{
  followCount = 0;
  likeCount = 0;
  likeAndFollow()
})

const unfollowJob = nodeSchedule.scheduleJob('Unfollow','0 0 5 * * * *', unfollowNotFollowing)

console.log('Like and follow next run', likeAndFollowJob.nextInvocation()._date.format('HH:mm DD/MM'))
console.log('Unfollow next run', unfollowJob.nextInvocation()._date.format('HH:mm DD/MM'))