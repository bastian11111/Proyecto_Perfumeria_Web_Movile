from pymongo import MongoClient

# URL de conexión local por defecto de MongoDB
MONGO_URI = "mongodb://localhost:27017/"

try:
    # Inicializar el cliente de MongoDB
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    
    # Forzar una llamada al servidor para comprobar que responde
    client.admin.command('ping')
    
    print("¡Conexión exitosa a MongoDB!")
    
    # Listar las bases de datos disponibles para verificar interacción
    dbs = client.list_database_names()
    print("Bases de datos disponibles:", dbs)

except Exception as e:
    print(f"Error al conectar con MongoDB: {e}")