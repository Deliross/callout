const truthy = new Set(['1', 'true', 'yes', 'on']);

export const featureFlags = Object.freeze({
  creatorGuilds: process.env.FEATURE_CREATOR_GUILDS == null || truthy.has(String(process.env.FEATURE_CREATOR_GUILDS).toLowerCase()),
  richComposer: process.env.FEATURE_RICH_COMPOSER == null || truthy.has(String(process.env.FEATURE_RICH_COMPOSER).toLowerCase()),
  notificationControls: process.env.FEATURE_NOTIFICATION_CONTROLS == null || truthy.has(String(process.env.FEATURE_NOTIFICATION_CONTROLS).toLowerCase()),
  profileStudio: process.env.FEATURE_PROFILE_STUDIO == null || truthy.has(String(process.env.FEATURE_PROFILE_STUDIO).toLowerCase()),
  topics: process.env.FEATURE_TOPICS == null || truthy.has(String(process.env.FEATURE_TOPICS).toLowerCase()),
  anonymous: process.env.FEATURE_ANONYMOUS == null || truthy.has(String(process.env.FEATURE_ANONYMOUS).toLowerCase()),
  postStates: process.env.FEATURE_POST_STATES == null || truthy.has(String(process.env.FEATURE_POST_STATES).toLowerCase()),
  pinboards: process.env.FEATURE_PINBOARDS == null || truthy.has(String(process.env.FEATURE_PINBOARDS).toLowerCase()),
  battles: process.env.FEATURE_BATTLES == null || truthy.has(String(process.env.FEATURE_BATTLES).toLowerCase()),
  predictions: process.env.FEATURE_PREDICTIONS == null || truthy.has(String(process.env.FEATURE_PREDICTIONS).toLowerCase()),
  heatFrames: process.env.FEATURE_HEAT_FRAMES == null || truthy.has(String(process.env.FEATURE_HEAT_FRAMES).toLowerCase()),
  aboutWall: process.env.FEATURE_ABOUT_WALL == null || truthy.has(String(process.env.FEATURE_ABOUT_WALL).toLowerCase()),
  notificationUi: process.env.FEATURE_NOTIFICATION_UI == null || truthy.has(String(process.env.FEATURE_NOTIFICATION_UI).toLowerCase())
});
