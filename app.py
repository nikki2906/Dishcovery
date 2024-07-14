
from flask import Flask, render_template
app = Flask(__name__)                    # this gets the name of the file so Flask knows it's name

@app.route("/")                          # this tells you the URL the method below is related to
def hello_world():
    return render_template('homepage.html')
  
if __name__ == '__main__':               # this should always be at the end
    app.run(debug=True, host="0.0.0.0")