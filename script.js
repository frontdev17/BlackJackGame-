document.addEventListener("DOMContentLoaded", function () {
    // Elements
    const dealButton = document.getElementById("deal-button");
    const hitButton = document.getElementById("hit-button");
    const standButton = document.getElementById("stand-button");
    const dealerCards = document.getElementById("dealer-cards");
    const playerCards = document.getElementById("player-cards");
    const gameMessage = document.getElementById("game-message");
    const betInfo = document.getElementById("bet-info");
    const chips = document.querySelectorAll(".chip");
    const playerBalanceElement = document.getElementById("player-balance");

    // Game Variables
    let deck = [];
    let dealerHand = [];
    let playerHand = [];
    let currentBet = 0;
    let playerBalance = 300;

    // Audio Files
    const sounds = {
        chip: new Audio('audio/chip.mp3'),
        deal: new Audio('audio/deal.mp3'),
        hit: new Audio('audio/hit.mp3'),
        stand: new Audio('audio/stand.mp3'),
        win: new Audio('audio/win.mp3'),
        lose: new Audio('audio/lose.mp3'),
        draw: new Audio('audio/draw.mp3'),
        blackjack: new Audio('audio/blackjack.mp3'),
        gameOver: new Audio('audio/game_over.mp3')
    };

    // Helper Functions
    function createDeck() {
        const suits = ["hearts", "spades", "diamonds", "clubs"];
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        deck = [];

        for (let suit of suits) {
            for (let value of values) {
                deck.push({ value, suit });
            }
        }

        deck = shuffleDeck(deck);
    }

    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    function dealCard(hand, targetDiv) {
        if (deck.length > 0) {
            const card = deck.pop();
            hand.push(card);

            const cardDiv = document.createElement("div");
            cardDiv.classList.add("card", "animated-card");
            cardDiv.textContent = `${card.value}${getSuitSymbol(card.suit)}`;

            if (card.suit === "hearts" || card.suit === "diamonds") {
                cardDiv.classList.add("red");
            }

            targetDiv.appendChild(cardDiv);
            sounds.deal.play();
        }
    }

    function getSuitSymbol(suit) {
        const suitSymbols = {
            "hearts": "♥",
            "spades": "♠",
            "diamonds": "♦",
            "clubs": "♣"
        };
        return suitSymbols[suit];
    }

    function calculateScore(hand) {
        let score = 0;
        let aces = 0;

        for (let card of hand) {
            if (card.value === "A") {
                score += 11;
                aces++;
            } else if (["J", "Q", "K"].includes(card.value)) {
                score += 10;
            } else {
                score += parseInt(card.value);
            }
        }

        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }

        return score;
    }

    function updateScores() {
        const playerScore = calculateScore(playerHand);
        const dealerScore = calculateScore(dealerHand);

        document.getElementById("player-score").textContent = `Score: ${playerScore}`;
        document.getElementById("dealer-score").textContent = `Score: ${dealerScore}`;

        return { playerScore, dealerScore };
    }

    function resetGame() {
        playerBalance = 300;
        currentBet = 0;
        playerBalanceElement.textContent = `Balance: $${playerBalance}`;
        betInfo.textContent = `Bet: $${currentBet}`;
        gameMessage.textContent = "";
        dealerCards.innerHTML = "";
        playerCards.innerHTML = "";
        hitButton.disabled = true;
        standButton.disabled = true;
    }

    function handleGameOver() {
        sounds.gameOver.play();
        gameMessage.textContent = "Game Over! You have run out of money.";
        setTimeout(() => {
            const playAgain = confirm("Game Over! Would you like to play again?");
            if (playAgain) {
                resetGame();
            }
        }, 1000);
    }

    function resetBetAmount() {
        currentBet = 0;
        betInfo.textContent = `Bet: $${currentBet}`;
    }

    // Button Events
    dealButton.addEventListener("click", function () {
        if (currentBet <= 0) {
            gameMessage.textContent = "Please place a bet before dealing.";
            return;
        }

        if (playerBalance < currentBet) {
            gameMessage.textContent = "Insufficient balance to place the bet.";
            return;
        }

        createDeck();
        dealerHand = [];
        playerHand = [];
        dealerCards.innerHTML = "";
        playerCards.innerHTML = "";
        gameMessage.textContent = "";

        playerBalance -= currentBet;
        playerBalanceElement.textContent = `Balance: $${playerBalance}`;

        dealCard(playerHand, playerCards);
        dealCard(dealerHand, dealerCards);
        dealCard(playerHand, playerCards);
        dealCard(dealerHand, dealerCards);

        updateScores();

        hitButton.disabled = false;
        standButton.disabled = false;

        const playerScore = calculateScore(playerHand);
        if (playerScore === 21) {
            gameMessage.textContent = "Blackjack! You win!";
            sounds.blackjack.play();
            playerBalance += currentBet * 2.5;
            playerBalanceElement.textContent = `Balance: $${playerBalance}`;
            hitButton.disabled = true;
            standButton.disabled = true;
            resetBetAmount(); // Reset bet amount after game ends
        }
    });

    hitButton.addEventListener("click", function () {
        sounds.hit.play();
        dealCard(playerHand, playerCards);
        const { playerScore } = updateScores();

        if (playerScore > 21) {
            gameMessage.textContent = "You Bust! Dealer Wins.";
            sounds.lose.play();
            hitButton.disabled = true;
            standButton.disabled = true;
            resetBetAmount(); // Reset bet amount after game ends

            if (playerBalance <= 0) {
                handleGameOver();
            }
        }
    });

    standButton.addEventListener("click", function () {
        sounds.stand.play();
        hitButton.disabled = true;
        standButton.disabled = true;

        let { dealerScore } = updateScores();

        while (dealerScore < 17) {
            dealCard(dealerHand, dealerCards);
            dealerScore = calculateScore(dealerHand);
            updateScores();
        }

        const playerScore = calculateScore(playerHand);

        if (dealerScore > 21 || playerScore > dealerScore) {
            gameMessage.textContent = "You Win!";
            sounds.win.play();
            playerBalance += currentBet * 2;
        } else if (dealerScore > playerScore) {
            gameMessage.textContent = "Dealer Wins!";
            sounds.lose.play();
        } else {
            gameMessage.textContent = "It's a Draw!";
            sounds.draw.play();
            playerBalance += currentBet; // Return the bet in case of a draw
        }

        playerBalanceElement.textContent = `Balance: $${playerBalance}`;

        resetBetAmount(); // Reset bet amount after game ends

        if (playerBalance <= 0) {
            handleGameOver();
        }
    });

    // Betting Events
    chips.forEach(chip => {
        chip.addEventListener("click", function () {
            const chipValue = parseInt(this.getAttribute("data-value"));

            if (currentBet + chipValue > playerBalance) {
                gameMessage.textContent = "You cannot bet more than your current balance.";
                return;
            }

            currentBet += chipValue;
            betInfo.textContent = `Bet: $${currentBet}`;
            sounds.chip.play();
        });
    });
});
