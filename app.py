from flask import Flask, render_template

app = Flask(__name__) 

@app.route("/") 
@app.route("/homepage.html")
def dishcovery():
    return render_template('homepage.html')

@app.route("/restaurants.html")
def restaurants():
    return render_template('restaurants.html')

@app.route("/recipes.html")
def recipes():
    return render_template('recipes.html')

if __name__ == '__main__': 
    app.run(debug=True, host="0.0.0.0")