import { tw, general, ui } from './helper.js';

export class TwitchServices {
  /*
   * Internal Helpers
   */

  /*
  *async #subProfilesInfo(usernames = []) {
  *  const query = tw.buildQuery(usernames, 'id');
  *  const response = await tw.apiRequest('https://api.twitch.tv/helix/categories', query);
*
  *  const profilesData = response.data;
*
  *  if (general.isEmpty(profilesData)) {
  *    return null;
  *  }
*
  *  // I need these data separate. ids for next actions, names for UI.
  *  const ids = profilesData.map((profile) => profile.id);
  *  const names = profilesData.map((profile) => profile.login);
*
  *  return { ids, names };
  }*/

  async #subProfilesInfo(usernames = []) {
    ui.logStatus('Subprofile start function detected');
    ui.logStatus(`Check var ${usernames}`);
    /*const query = tw.buildQuery(usernames);*/
    /*const id = await tw.apiRequest('https://api.twitch.tv/helix/categories', query);*/
    ui.logStatus('buildquery worked');
    ui.logStatus(`Check var ${usernames}`);

    const response = await tw.apiRequest('https://api.twitch.tv/helix/search/categories', `query=${usernames}`);
    ui.logStatus('Api request worked');
    ui.logStatus(`Found response : ${JSON.stringify(response)}`);
    ui.logStatus(`Found response : ${response} . . .`);
    ui.logStatus(JSON.stringify(response.data));

    ui.logStatus(`Found response data : ${response.data} . . .`);
    
    const profilesData = response.data;
    ui.logStatus('response.data wrote in profilesData');

    if (general.isEmpty(profilesData)) {
      return null;
    }
    ui.logStatus('Profiles data is not empty');
    ui.logStatus(`Found profile data : ${profilesData} . . .`);

    // I need these data separate. ids for next actions, names for UI.
    const ids = profilesData.map((profile) => profile.id); /*profilesData.map((profile) => profile.id);*/
    const names = profilesData.map((profile) => profile.name);
    ui.logStatus(`Found ids : ${JSON.stringify(ids)} . . .`);
    ui.logStatus(`Found names : ${JSON.stringify(names)} . . .`);

    return { ids, names };
  }


  async #followingsPerUser(id) {
    const result = [];

    let active = true;
    let paginationKey = '';
    // Api has 100 items return limit.
    ui.logStatus(`IdCheck : ${id} . . .`);
    // We are getting the full data chunk by chunk size of 100:
    do {
      const response = await tw.apiRequest('https://api.twitch.tv/helix/streams', `game_id=${id}&first=100&after=${paginationKey}`) /*&first=100&after=${paginationKey}*/
      const followingsDataChunk = response.data;

      if (general.isEmpty(followingsDataChunk)) {
        return null;
      }

      ui.logStatus(`List of found streamers : ${response.user_name} . . .`);

      // Save current chunk of received data:
      followingsDataChunk.forEach((stream) => {
        if (stream.user_name) result.push(stream.user_name);
        ui.logStatus(`Found stream : ${stream.user_name} . . .`);
      });

      // Is there any more data?
      if (response?.pagination?.cursor) {
        paginationKey = response.pagination.cursor;
      } else {
        active = false;
      }
    } while (active);

    ui.logStatus(`List of found streamers : ${result} . . .`);

    return result;
  }

  async #subLiveChannels(channels = []) {
    const result = [];

    //const query = tw.buildQuery(channels, 'user_login');
    const response = await tw.apiRequest('https://api.twitch.tv/helix/streams', `game_id=${channels}`);

    const liveChannelsData = response.data;

    if (general.isEmpty(liveChannelsData)) {
      return null;
    }

    // Saving:
    liveChannelsData.forEach((channel) => {
      if (channel.user_login) result.push(channel.user_login);
    });

    return result;
  }

  /*
   * Main Services
   */
  async getProfilesInfo(usernames = []) {
    // Set user input limit:
    if (usernames.length > 500) {
      throw new Error('Input limit exceeded. The maximum limit is 500');
    }

    let ids = [];
    let names = [];

    // Chunk the user input size of 100:
    const usernameChunks = general.chunkArray(usernames, 100);
    ui.logStatus('Categories chunked');

    // Load data chunk by chunk:
    for (let i = 0; i < usernames.length; i++) {
      const subResult = await this.#subProfilesInfo(usernames[i]);

      if (subResult === null) continue;

      ids = ids.concat(subResult.ids);
      names = names.concat(subResult.names);
      ui.logStatus(`Found names : ${names}`);
    }

    if (general.isEmpty(ids) || general.isEmpty(names)) {
      throw new Error('No data found');
    }

    return { ids, names };
  }

  async getFollowings(ids = []) {
    let channels = [];

    // Load one by one:
    for (let i = 0; i < ids.length; i++) {
      const subResult = await this.#followingsPerUser(ids[i]);

      if (subResult === null) continue;

      channels = channels.concat(subResult);
    }

    ui.logStatus(`Subresult : ${subResult} . . .`);

    if (general.isEmpty(channels)) {
      throw new Error('No data found');
    }

    ui.unblockSpyButton();

    return [...new Set(channels)];
  }

  async getLiveChannels(channels = []) {
    let liveChannels = [];

    const channelsChunks = general.chunkArray(channels, 1);

    // Load chunk by chunk:
    for (let i = 0; i < channelsChunks.length; i++) {
      const subResult = await this.#subLiveChannels(channelsChunks[i]);

      ui.logStatus(`Foreach ${channelsChunks[i]}`);

      if (subResult === null) continue;

      liveChannels = liveChannels.concat(subResult);
    }

    if (general.isEmpty(liveChannels)) {
      throw new Error('There are no live channels right now');
    }

    return liveChannels;
  }
}
