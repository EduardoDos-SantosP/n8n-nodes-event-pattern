![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-event-pattern

Este pacote fornece dois nodes para n8n que implementam o padrão "Event
Listener": um node emissor de eventos (Event Emitter) e um trigger que escuta
eventos (Event Listener Trigger).

## Instalação

Via comando npm:

```bash
npm install n8n-nodes-event-pattern
```

Ou pela interface gráfica do n8n.

## Uso

- Event Emitter
    - Objetivo: publicar um evento com um payload JSON.
    - Campos principais:
        - Channel: selecione o canal (ex.: Redis) configurado nas credenciais do
          n8n.
        - Event name: nome/tipo do evento (string usada para rotear a mensagem).
        - Event Payload: JSON com os dados que serão enviados.
    - Comportamento: quando executado o node publica o payload no tópico
      correspondente ao nome do evento.

- Event Listener Trigger
    - Objetivo: escutar eventos e disparar o workflow quando uma mensagem chega.
    - Campos principais:
        - Channel: selecione o mesmo canal usado pelo emissor.
        - Event name: o nome do evento a escutar (deve coincidir com o do
          emissor).
    - Comportamento: o trigger fica aguardando mensagens no tópico do evento e,
      ao receber uma, inicia o workflow com o payload recebido.

## Observações

- Para que a comunicação funcione, configure corretamente as credenciais do
  canal escolhido (por exemplo, dados de conexão do Redis) no painel de
  credenciais do n8n.
- Reinicie o n8n depois de instalar os nodes para que apareçam no editor.
