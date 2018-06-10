# InstagramBot

Yet another bot trying to give you a small advantage by manipulating the goodwill of others.

It will like and follow users of a hashtag of your choice, three times a day, and unfollow everyone who doesn't follow you back in the morning before starting work.

Its very much a set and forget system.

To use:

- Install NodeJS
- Clone the project into a local folder
- Change to project directory and run `npm install`
- Install PM2 to keep it alive:
`npm install -g pm2`
- Create a /cookies directory
- Create a /logs directory
- Create an ecosystem.config.js file in the root of the project:

*ecosystem.config.js*

**replace instagram_username, instagram_password, and hashtag_to_stalk with appropriate content**

```javascript
module.exports = {
  apps : [
    {
      name      : 'InstagramBot',
      script    : 'app.js',
      cron_restart: "0 0 * * *",
      env: {
        USERNAME: 'instagram_username',
        PASSWORD: 'instagram_password',
        HASHTAG: 'hashtag_to_stalk,different_hashtag_to_stalk'
      }
    }
  ]
};
```

- run `pm2 start ecosystem.config.js`

*Optional*

If you want the script to start on server start, run:
`pm2 startup`

It may give you some instructions for your OS. Read them and do it.

then run
`pm2 save` to save the current config.

