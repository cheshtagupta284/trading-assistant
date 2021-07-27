from keras import Sequential
from keras.layers import Dense, LSTM
from keras.preprocessing.sequence import TimeseriesGenerator
from pandas import read_csv
from pandas_datareader import DataReader
from sklearn.preprocessing import MinMaxScaler

def build(symbol):
    scaler = MinMaxScaler()
    df = DataReader(symbol, data_source='yahoo', start='01-01-2010')
    df = scaler.fit_transform(df['Close'].values.reshape(-1, 1))
    df = TimeseriesGenerator(df, df, length=60)
    model = Sequential()
    model.add(LSTM(128, input_shape=(df.length, 1)))
    model.add(Dense(32))
    model.add(Dense(1))
    model.compile(optimizer='adam', loss='mean_squared_error')
    model.fit(df, batch_size=1024, epochs=64)
    model.save(f'model/{symbol}.h5')

if __name__ == '__main__':
    df = read_csv('market.csv')
    df['Symbol'].apply(build)
