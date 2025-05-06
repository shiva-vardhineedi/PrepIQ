import pika

connection = pika.BlockingConnection(pika.URLParameters('amqp://guest:guest@localhost:5672/'))
channel = connection.channel()
channel.queue_declare(queue='test_queue', durable=True)
channel.basic_publish(exchange='', routing_key='test_queue', body='Test message')
print("Message sent!")
connection.close()