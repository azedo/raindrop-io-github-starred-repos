# Add your github starred repos to raindrop.io as bookmarks

This script will automatically add all of your starred github repos (the ones you starred from other people) into raindrop.io as bookmarks.

## What you need to do?

1. Copy and rename the `.env.example` to `.env`;
2. Generate a personal token for github and add it to the `.env` file <https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token>;
3. Generate an authentication token in the raindrop.io app:
   1. Go to -> <https://app.raindrop.io/settings/integrations>;
   2. Then click `+ Create a new app` under the `For Developers` section;
   3. Now, click on the name of your fresh generated app and then click in `Create test token`;
   4. Finally copy this `test token` in the `.env` file;
4. Follow the steps described in the `index.js` starting at line `166`;
