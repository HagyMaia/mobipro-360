# Corridas

## Definicao

Uma corrida representa uma viagem solicitada por um passageiro e atendida por um motorista aprovado.

---

## Fluxo principal

Passageiro solicita corrida
-> Sistema busca motoristas
-> Motorista aceita
-> Motorista vai ao embarque
-> Motorista chega
-> Corrida e iniciada
-> Corrida e finalizada
-> Pagamento e confirmado
-> Passageiro e motorista avaliam a experiencia

---

## Status da corrida

REQUESTED
SEARCHING_DRIVER
DRIVER_ASSIGNED
DRIVER_ARRIVING
DRIVER_ARRIVED
IN_PROGRESS
COMPLETED
CANCELLED_BY_PASSENGER
CANCELLED_BY_DRIVER
CANCELLED_BY_SYSTEM
PAYMENT_PENDING
PAYMENT_FAILED

---

## Regras importantes

1. Um motorista nao pode aceitar duas corridas simultaneamente.
2. Toda corrida deve possuir historico de eventos.
3. Cancelamentos devem possuir motivo.
4. Alteracoes administrativas devem possuir auditoria.
5. Pagamentos devem ser registrados separadamente.
6. Corridas concluidas nao devem ser apagadas.
