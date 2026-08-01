# 🔑 Meta API Token Setup Guide (One-Time Setup)

To allow the automated script to publish tool posts to your Facebook Page and Instagram Business account, you need to generate three credentials and save them as GitHub Secrets. 

Once saved, the daily pipeline will run completely on autopilot with no manual steps needed!

---

## Part 1: Get Your Page and Account IDs

### 1. Get `FB_PAGE_ID`
- Go to your Facebook Page.
- Click **About** -> **Page Transparency** (or look at the page URL).
- Copy the numeric **Page ID**.

### 2. Get `IG_BUSINESS_ID`
- Go to the [Meta Business Suite](https://business.facebook.com/).
- Go to **Settings** -> **Asset Library** -> **Instagram Accounts**.
- Select your account and copy the numeric **Instagram Account ID**.

---

## Part 2: Generate `FB_PAGE_ACCESS_TOKEN`

To get a permanent access token that never expires:

1. **Create a Meta Developer App**:
   - Go to [Meta for Developers](https://developers.facebook.com/) and register.
   - Click **My Apps** -> **Create App**.
   - Choose **Other** -> **Business** (or consumer) type.
   - Name your app (e.g. `ToolNova Social Poster`) and link it to your Facebook Business Portfolio.

2. **Add Permissions**:
   - Inside your App Dashboard, go to **API Tooling** or **Graph API Explorer** (tools menu).
   - Select your Facebook Page in the dropdown.
   - Under **User or Page**, select **Get Page Access Token**.
   - Add these permissions in the sidebar:
     - `pages_show_list`
     - `pages_read_engagement`
     - `pages_manage_posts`
     - `instagram_basic`
     - `instagram_content_publish`
   - Click **Generate Access Token** and approve permissions.

3. **Make the Token Permanent**:
   - By default, tokens expire in 60 days. To make it permanent:
   - Go to **Business Settings** (`business.facebook.com/settings`) -> **Users** -> **System Users**.
   - Click **Add** to create a new System User (role: *Admin*).
   - Click **Assign Assets** and select your Page, giving it Full Control.
   - Click **Generate New Token**, select your App, check all the permissions above, and click **Generate**.
   - Copy this token—it will **never expire**!

---

## Part 3: Add Secrets to GitHub

1. Go to your GitHub Repository.
2. Click **Settings** -> **Secrets and variables** -> **Actions**.
3. Under **Repository secrets**, click **New repository secret** and add:

| Secret Name | Value |
|---|---|
| `FB_PAGE_ID` | Your Facebook Page ID |
| `IG_BUSINESS_ID` | Your Instagram Account ID |
| `FB_PAGE_ACCESS_TOKEN` | The permanent System User Token |

---

All done! Your daily pipeline will now automatically publish posts with screenshot previews whenever a new tool builds.
