import sqlite3

# Connect to the SQLite database (it will create the database if it doesn't exist)
conn = sqlite3.connect('quiz_database.db')  # Specify the name of your database file
cursor = conn.cursor()

# Create the quizzes table (if it doesn't exist)
cursor.execute('''
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_name TEXT,
    subtopics TEXT,
    question TEXT,
    choices TEXT,
    answer TEXT
)
''')

# Commit and close the connection
conn.commit()
conn.close()

print("Database and quizzes table created successfully.")
