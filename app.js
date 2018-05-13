const InstagramBot = require('./lib')
const nodeSchedule = require('node-schedule')

let likeCount = 0
let followCount = 0
let maxLike = 100
let maxFollow = 60
const HASHTAGS = process.env.HASHTAG.split(',')

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
  randomLikeAndFollowCounts()
  shuffle(HASHTAGS)
  try {
    for (let hashtag of HASHTAGS) {
      const results = await instagramBot.likeAndFollowHashtag(hashtag, maxLike - likeCount, maxFollow - followCount)
      likeCount += results.likeCount
      followCount += results.followCount
    }
  } catch (e) {
    console.error(e)
  } finally {
    if (likeCount < maxLike && followCount < maxFollow) {
      console.log('Sleeping', maxLike - likeCount, maxFollow - followCount)
      await instagramBot.randomPause(60 * 3)
      likeAndFollow()
    } else {
      console.log('Like and follow finished, next run', likeAndFollowJob.nextInvocation()._date.format('HH:mm DD/MM'))
    }
  }
}

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomLikeAndFollowCounts () {
  maxLike = getRandomInt(140,60)
  maxFollow = getRandomInt(40, 80)
}

function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

const likeAndFollowJob = nodeSchedule.scheduleJob('Like and follow', '0 0 7,13,18 * * * *', () => {
  followCount = 0
  likeCount = 0
  setTimeout(likeAndFollow, 1000 * getRandomInt(60*60, 0))
})

const unfollowJob = nodeSchedule.scheduleJob('Unfollow', '0 0 5 * * * *', unfollowNotFollowing)

console.log('Like and follow next run', likeAndFollowJob.nextInvocation()._date.format('HH:mm DD/MM'))
console.log('Unfollow next run', unfollowJob.nextInvocation()._date.format('HH:mm DD/MM'))

likeAndFollow()