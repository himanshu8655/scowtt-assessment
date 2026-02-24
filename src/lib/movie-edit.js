export function applyOptimisticMovie(user, nextMovie) {
  return { ...user, favoriteMovie: nextMovie };
}

export function rollbackMovie(user, previousMovie) {
  return { ...user, favoriteMovie: previousMovie };
}
