import re

# Standard lists of financially positive and negative keywords for lexicon weighted NLP
FINANCIAL_POSITIVE_WORDS = {
    "bullish", "beat", "surge", "gain", "rise", "grow", "buy", "outperform", "upgrade", 
    "acquisition", "profit", "optimism", "recovery", "strong", "higher", "positive", 
    "expand", "dividend", "exceeds", "beat", "upgraded", "momentum", "success", "innovative",
    "profitability", "advances", "soars", "rally", "record", "jumpward", "exceeding", "beats"
}

FINANCIAL_NEGATIVE_WORDS = {
    "bearish", "miss", "plunge", "drop", "decline", "fall", "sell", "underperform", "downgrade", 
    "loss", "fear", "recession", "weak", "lower", "negative", "shrink", "debt", "lawsuit", 
    "deficit", "investigation", "fined", "downgraded", "deficit", "plummets", "slumps", 
    "contraction", "bankruptcy", "probe", "shortfall", "decline", "warning", "risks", "selloff"
}

def analyze_sentiment_lexicon(text):
    """
    NLP Lexicon-based sentiment scoring analyzer tailored for corporate market news.
    Returns scores: positive, negative, neutral percentages, and a composite score between -1 and 1.
    """
    if not text or not isinstance(text, str):
        return {
            "positive": 0.0,
            "negative": 0.0,
            "neutral": 1.0,
            "score": 0.0,
            "sentiment": "NEUTRAL"
        }
        
    # Clean text and tokenize
    cleaned_text = re.sub(r'[^a-zA-Z\s]', '', text.lower())
    words = cleaned_text.split()
    
    if len(words) == 0:
        return {
            "positive": 0.0,
            "negative": 0.0,
            "neutral": 1.0,
            "score": 0.0,
            "sentiment": "NEUTRAL"
        }
        
    pos_count = 0
    neg_count = 0
    
    # Simple sliding negation check (e.g. "not positive")
    negation_tokens = {"not", "never", "no", "cant", "wont", "against", "lack", "without"}
    
    for i, word in enumerate(words):
        is_negated = False
        # Check previous two words for negations
        if i > 0 and words[i-1] in negation_tokens:
            is_negated = True
        elif i > 1 and words[i-2] in negation_tokens:
            is_negated = True
            
        if word in FINANCIAL_POSITIVE_WORDS:
            if is_negated:
                neg_count += 1
            else:
                pos_count += 1
        elif word in FINANCIAL_NEGATIVE_WORDS:
            if is_negated:
                pos_count += 1
            else:
                neg_count += 1
                
    total_relevant = pos_count + neg_count
    
    if total_relevant == 0:
        return {
            "positive": 0.0,
            "negative": 0.0,
            "neutral": 1.0,
            "score": 0.0,
            "sentiment": "NEUTRAL"
        }
        
    pos_ratio = pos_count / total_relevant
    neg_ratio = neg_count / total_relevant
    
    # Calculate composite polarity score between -1.0 and 1.0
    polarity_score = (pos_count - neg_count) / total_relevant
    # Smooth score slightly based on presence of other words to represent conviction density
    conviction_density = min(1.0, total_relevant / (len(words) * 0.4 + 1))
    composite_score = round(polarity_score * conviction_density, 3)
    
    # Determine classification thresholds
    if composite_score >= 0.15:
        sentiment = "BULLISH"
    elif composite_score <= -0.15:
        sentiment = "BEARISH"
    else:
        sentiment = "NEUTRAL"
        
    # Calculate percentage fractions for neutral
    total_words = len(words)
    pos_pct = round(pos_count / total_words, 3)
    neg_pct = round(neg_count / total_words, 3)
    neu_pct = round((total_words - pos_count - neg_count) / total_words, 3)
    
    return {
        "positive": pos_pct,
        "negative": neg_pct,
        "neutral": neu_pct,
        "score": composite_score,
        "sentiment": sentiment
    }
