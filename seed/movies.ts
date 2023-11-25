import {Movie, MovieCast, Review } from '../shared/types' //updated imports

export const movies : Movie[] = [
  {
    movieId: 1234,
    genre_ids: [28, 14, 32],
    original_language: 'en',
    overview:
      "Every six years, an ancient order of jiu-jitsu fighters joins forces to battle a vicious race of alien invaders. But when a celebrated war hero goes down in defeat, the fate of the planet and mankind hangs in the balance.",
    popularity: 2633.943,
    release_date: "2020-11-20",
    title: "Title 1234",
    video: false,
    vote_average: 5.9,
    vote_count: 111,
  },
  {
    movieId: 4567,
    genre_ids: [28, 14, 32],
    original_language: 'fr',
    overview:
      "Every six years, an ancient order of jiu-jitsu fighters joins forces to battle a vicious race of alien invaders. But when a celebrated war hero goes down in defeat, the fate of the planet and mankind hangs in the balance.",
    popularity: 2633.943,
    release_date: "2020-11-20",
    title: "Title 1234",
    video: false,
    vote_average: 5.9,
    vote_count: 111,
  },
  {
    movieId: 2345,
    genre_ids: [28, 14, 32],
    original_language: 'en',
    overview:
      "Every six years, an ancient order of jiu-jitsu fighters joins forces to battle a vicious race of alien invaders. But when a celebrated war hero goes down in defeat, the fate of the planet and mankind hangs in the balance.",
    popularity: 2633.943,
    release_date: "2020-11-21",
    title: "Title 2345",
    video: false,
    vote_average: 5.9,
    vote_count: 111,
  },
  {
    movieId: 3456,
    genre_ids: [28, 14, 32],
    original_language: 'en',
    overview:
      "Every six years, an ancient order of jiu-jitsu fighters joins forces to battle a vicious race of alien invaders. But when a celebrated war hero goes down in defeat, the fate of the planet and mankind hangs in the balance.",
    popularity: 2633.943,
    release_date: "2020-11-21",
    title: "Title 3456",
    video: false,
    vote_average: 5.9,
    vote_count: 111,
  },
];

// new movieCast data
export const movieCasts: MovieCast[] = [
  {
    movieId: 1234,
    actorName: "Joe Bloggs",
    roleName: "Male Character 1",
    roleDescription: "description of character 1",
  },
  {
    movieId: 1234,
    actorName: "Alice Broggs",
    roleName: "Female Character 1",
    roleDescription: "description of character 2",
  },
  {
    movieId: 1234,
    actorName: "Joe Cloggs",
    roleName: "Male Character 2",
    roleDescription: "description of character 3",
  },
  {
    movieId: 2345,
    actorName: "Joe Bloggs",
    roleName: "Male Character 1",
    roleDescription: "description of character 3",
  },
];

export const reviews : Review[] = [
  {
    movieId: 1234,
    reviewerName: "Jack Duggan",
    reviewDate: "18/11/2023",
    reviewContent: "Loved this film, excellent watch.",
    reviewRating: 8
  },
  {
    movieId: 1234,
    reviewerName: "James Jameson",
    reviewDate: "15/11/2023",
    reviewContent: "Incredible!!!",
    reviewRating: 9
  },
  {
    movieId: 1234,
    reviewerName: "Angry Man",
    reviewDate: "13/11/2023",
    reviewContent: "Not very good to be honest.",
    reviewRating: 3
  },
  {
    movieId: 1234,
    reviewerName: "Patrick Kielty",
    reviewDate: "25/11/2023",
    reviewContent: "Almost as good as the toy show!",
    reviewRating: 8
  },
  {
    movieId: 1234,
    reviewerName: "bob",
    reviewDate: "01/01/1999",
    reviewContent: "testing",
    reviewRating: 1
  }
];