export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'clearScores' : IDL.Func([], [], []),
    'getHighScore' : IDL.Func([], [IDL.Nat], ['query']),
    'updateScore' : IDL.Func([IDL.Nat], [IDL.Nat], []),
  });
};
export const init = ({ IDL }) => { return []; };
