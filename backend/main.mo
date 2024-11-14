import Array "mo:base/Array";
import Int "mo:base/Int";
import Nat "mo:base/Nat";

actor {
    // Stable variable to store high scores
    stable var highScores : [Nat] = [];
    
    // Update score and return the current high score
    public shared func updateScore(score : Nat) : async Nat {
        highScores := Array.append(highScores, [score]);
        let currentHighScore = await getHighScore();
        return currentHighScore;
    };
    
    // Get the current high score
    public query func getHighScore() : async Nat {
        if (highScores.size() == 0) {
            return 0;
        };
        
        var maxScore = highScores[0];
        for (score in highScores.vals()) {
            if (score > maxScore) {
                maxScore := score;
            };
        };
        return maxScore;
    };
    
    // Clear all scores
    public shared func clearScores() : async () {
        highScores := [];
    };
}
