from flask import Flask
from flask_cors import CORS
from keras.models import load_model
from pandas import read_csv
from pandas_datareader import DataReader
from sklearn.preprocessing import MinMaxScaler
from datetime import date

app = Flask(__name__)
cache, cachedate = None, None
CORS(app)
def predict(symbol):
    scaler = MinMaxScaler()
    model = load_model(f'model/{symbol}.h5')
    idf = df = DataReader(symbol, data_source='yahoo', start='08-01-2020')
    df = scaler.fit_transform(df['Close'][-60:].values.reshape(-1, 1))
    res = model.predict(df.reshape(1, -1, 1))
    return symbol, idf['Close'][-1], scaler.inverse_transform(res)[0][0]

@app.route('/')
def home():
    global cache, cachedate
    if cachedate == date.today(): return cache
    cachedate = date.today()
    df = read_csv('market.csv')
    pdf = df['Symbol'].apply(predict)
    pdf.index = df['Symbol'].values
    cache =  pdf.to_json()
    return cache

if __name__ == '__main__':
    app.run()
