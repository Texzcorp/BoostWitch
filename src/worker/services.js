import { tw, general, ui } from './helper.js';

export class TwitchServices {
  /*
   * Internal Helpers
   */
  async #streamersInCategory(categoryNames = []) {
    const result = [];

<<<<<<< HEAD
    for (let i = 0; i < categoryNames.length; i++) {
      const response = await tw.apiRequest('https://api.twitch.tv/helix/streams', `game=${encodeURIComponent(categoryNames[i])}&first=100`);
=======
    let active = true;
    let paginationKey = '';
    // Api has 100 items return limit.
    // We are getting the full data chunk by chunk size of 100:
    do {
      const response = await tw.apiRequest('https://api.twitch.tv/helix/streams', `user_id=${id}&first=100&after=${paginationKey}`);
      const followingsDataChunk = response.data;
>>>>>>> parent of ea691d8 (zzadazef)

      const streamersData = response.data;

      if (general.isEmpty(streamersData)) {
        continue;
      }

      // Saving:
      streamersData.forEach((streamer) => {
        if (streamer.user_login) {
          result.push(streamer.user_login);
        }
      });
    }

    return result;
  }

  /*
   * Main Services
   */
  async getProfilesInfo(categories = []) {
    // Set user input limit:
    if (categories.length > 500) {
      throw new Error('Input limit exceeded. The maximum limit is 500');
    }

    let ids = [];
    let names = [];

    // Chunk the user input size of 100:
    const categoryChunks = general.chunkArray(categories, 100);

    // Load data chunk by chunk:
    for (let i = 0; i < categoryChunks.length; i++) {
      const subResult = await this.#streamersInCategory(categoryChunks[i]);

      if (subResult === null) continue;

      ids = ids.concat(subResult.ids);
      names = names.concat(subResult.names);
    }

    if (general.isEmpty(ids) || general.isEmpty(names)) {
      throw new Error('No data found');
    }

    return { ids, names };
  }

  async getLiveChannels(channels = []) {
    let liveChannels = [];

    const channelsChunks = general.chunkArray(channels, 100);

    // Load chunk by chunk:
    for (let i = 0; i < channelsChunks.length; i++) {
      const subResult = await this.#subLiveChannels(channelsChunks[i]);

      if (subResult === null) continue;

      liveChannels = liveChannels.concat(subResult);
    }

    if (general.isEmpty(liveChannels)) {
      throw new Error('There are no live channels right now');
    }

    return liveChannels;
  }
}
