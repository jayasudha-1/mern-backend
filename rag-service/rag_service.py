import os
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import re
import openai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Load Sentence Transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')
# Initialize the OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")
# Financial tips document with varied queries and rule variations
finance_tips = [
    "Follow the 50/30/20 rule: Spend 50% on needs, 30% on wants, and save 20%.",
    "Create a budget and stick to it: Determine your income and expenses, and create a plan for how much you will spend in each category. Try to minimize unnecessary spending and find ways to cut costs where possible.",
    "Increase your savings rate: Aim to save at least 20% of your income. If that's not feasible, start small by saving even $5 or $10 per paycheck.",
    "Automate your savings: Set up automatic transfers from your checking account to your savings account each month. This makes it easier to save consistently and reduces the temptation to spend the money.",
    "Pay yourself first: Treat savings like a bill that you have to pay before anything else. This can help ensure that you prioritize saving over other expenses.",
    "Make a plan for unexpected expenses: Set aside an emergency fund to cover at least 3-6 months of living expenses in case of unexpected events such as job loss or medical emergencies.",
    "Avoid debt: Try to pay off any existing debts as quickly as possible, and avoid taking on new debt whenever possible.",
    "Invest wisely: Consider investing a portion of your savings in stocks, bonds, or mutual funds to grow your wealth over time. Work with a financial advisor to create an investment plan that fits your goals and risk tolerance.",
    "Live below your means: Focus on living within your means and avoiding lifestyle inflation as your income increases. Instead, use any additional income to increase your savings rate or pay off debt.",
    "Find ways to earn extra money: Consider picking up a side hustle or finding other ways to earn extra income to boost your savings.",
    "Stay disciplined: It can be easy to get sidetracked and spend more than you should, but it's important to stay focused on your financial goals. Set reminders, track your spending, and hold yourself accountable to stick to your budget.",
    "Track your expenses using budgeting apps like Mint or YNAB.",
    "Avoid impulse purchases by waiting 24 hours before buying.",
    "Invest in index funds for long-term financial growth.",
    "Always pay your credit card bill on time to avoid high-interest rates.",
    "A savings account is a bank account that earns interest on your deposits, typically with low risk.",
    "To create a budget, list your monthly income and expenses, then allocate funds for each category based on priorities.",
    "It depends on your financial goals and risk tolerance. Diversifying across stocks, bonds, and real estate is commonly recommended.",
    "Compound interest is the interest on a loan or deposit that is calculated based on both the initial principal and the accumulated interest from previous periods.",
    "To start investing, assess your financial goals, risk tolerance, and time horizon. Consider diversifying your portfolio with stocks, bonds, and other assets. It’s advisable to start small and gradually increase your investments as you learn.",
    "A credit score is a numerical representation of your creditworthiness. It is based on your credit history, including your payment habits, outstanding debt, and length of credit history. A higher score can help you secure better loan terms.",
    "An emergency fund is a savings buffer set aside for unexpected expenses such as medical bills, car repairs, or job loss. It’s typically recommended to have 3 to 6 months' worth of living expenses saved up.",
    "To reduce debt, prioritize high-interest debts, make more than the minimum payments, and avoid accumulating more debt. Consider debt consolidation or refinancing options to lower interest rates.",
    "A Roth IRA allows you to contribute after-tax money, and qualified withdrawals are tax-free in retirement. A Traditional IRA allows you to contribute pre-tax money, but withdrawals are taxed as income in retirement.",
    "The stock market is a collection of markets where stocks (shares of publicly traded companies) are bought and sold. It provides companies with capital and gives investors a chance to own a part of companies and potentially profit from their growth.",
    "The debt-to-income ratio is the percentage of your monthly income that goes towards paying debts. A lower ratio is preferred by lenders, as it indicates that you have enough income to manage additional debt.",
    "Diversification involves spreading your investments across different asset classes (stocks, bonds, real estate) to reduce risk. The goal is to avoid putting all your money into one type of investment, which can be risky if it underperforms.",
    "Inflation is the rate at which the general level of prices for goods and services rises, eroding the purchasing power of money. A moderate level of inflation is normal, but high inflation can negatively affect the economy.",
    "A 401(k) is an employer-sponsored retirement savings plan that allows employees to contribute a portion of their salary on a pre-tax basis. Many employers also offer matching contributions, which can help boost your retirement savings.",
    "Net worth is calculated by subtracting your liabilities (debts) from your assets (what you own). If your assets exceed your liabilities, you have a positive net worth; if liabilities are higher, your net worth is negative.",
    "Dividends are payments made by companies to their shareholders, usually from profits. They can be a good source of income for investors who hold stocks in dividend-paying companies.",
    "A mortgage is a type of loan used to purchase real estate, where the property itself serves as collateral. Mortgages are typically repaid over 15 to 30 years with fixed or variable interest rates."
]

# Encode the finance tips into embeddings
embeddings = model.encode(finance_tips)
faiss_index = faiss.IndexFlatL2(embeddings.shape[1])  # L2 distance index
faiss_index.add(np.array(embeddings).astype(np.float32))

# Predefined responses for greetings
greeting_responses = {
    "hi": "Hello! How can I assist you with your finances today?",
    "hello": "Hi there! Need any financial advice?",
    "hey": "Hey! What financial question do you have?",
    "thank you": "You're welcome! Let me know if you need more help.",
    "thanks": "No problem! Happy to help."
}

# Preprocess query: lowercase, remove unnecessary special characters, and trim
def preprocess_query(query):
    query = query.lower().strip()
    query = re.sub(r"[^\w\s%/]", "", query)  # Keep %, /, and alphanumeric characters
    return query

# Function to generate a response using OpenAI's GPT
def generate_response_with_gpt(query, context):
    prompt = f"""
    You are a financial advisor. Based on the following context, provide a concise and accurate response to the user's query. Do not add any information that is not explicitly mentioned in the context.

    User Query: {query}
    Context: {context}

    Response:
    """
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",  # or "gpt-4"
        messages=[
            {"role": "system", "content": "You are a helpful financial advisor."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=150,
        temperature=0.7
    )
    return response.choices[0].message.content.strip()

@app.route("/get_answer", methods=["POST"])
def get_answer():
    data = request.json
    query = data.get('query', '').strip()

    # Preprocess the query
    processed_query = preprocess_query(query)

    # Check if the query is a greeting
    if processed_query in greeting_responses:
        return jsonify({"response": greeting_responses[processed_query]})

    # Generate embedding for the query
    query_embedding = model.encode([processed_query])

    # Search the FAISS index for finance-related answers
    distances, idx = faiss_index.search(np.array(query_embedding).astype(np.float32), k=3)

    # Get the best match distance and tip
    best_distance = distances[0][0]
    retrieved_context = finance_tips[idx[0][0]]

    # If the query is not related to finance (best distance is large), provide a fallback answer
    if best_distance > 1.2:  # Adjusted threshold for better matching
        return jsonify({"response": "Sorry, I can only provide financial advice. How can I assist you with finances?"})

    # Generate a response using OpenAI's GPT
    generated_response = generate_response_with_gpt(query, retrieved_context)

    # Return the generated response
    return jsonify({"response": generated_response})

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)