export interface Video {
  id: string;
  title: string;
  thumbnail: string;
}

export interface PlaylistData {
  items: Array<{
    snippet: {
      resourceId: {
        videoId: string;
      };
      title: string;
      thumbnails: {
        default: {
          url: string;
        };
      };
    };
  }>;
  nextPageToken?: string;
}
