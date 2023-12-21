# Eventh!ngs Backend Repository

<p align="center">
   <img src="https://github.com/Eventhings/backend-eventhings/assets/28957554/583ae431-25da-4796-8689-7fb1aba2a11d" width="500px"/>
</p>

In the ever-evolving landscape of event planning, Eventh!ngs emerges as a revolutionary solution, meticulously designed to simplify the intricate process of organizing events. The project’s Executive Summary encapsulates its core essence — a potent fusion of advanced technologies and user-centric design to redefine the event organization paradigm.

This repository is for the Backend services used for Eventh!ngs Product Capstone Project

## Team Members
- M296BSX0246 - Arsya Amalia Ristias - Universitas Pembangunan Nasional Veteran Jawa Timur - Machine Learning - [Active]
- M002BSY0363 - Kevin Sean Hans Lopulalan - Institut Teknologi Bandung - Machine Learning - [Active]
- M002BSY0484 - Moch Nabil Farras Dhiya - Institut Teknologi Bandung - Machine Learning - [Active]
- C002BSY3374 - Felix Fernando - Institut Teknologi Bandung - Cloud Computing - [Active]
- C296BSY3382 - Jose Bagus Ramadhan - Universitas Pembangunan Nasional Veteran Jawa Timur - Cloud Computing - [Active]
- A120BSY1987 - Abdul Hafiz Ramadan - Institut Teknologi Telkom Purwokerto - Mobile Development - [Active]
- A190BSY2058 - Ilham Maulana - Universitas Bhayangkara Jakarta Raya - Mobile Development - [Active]

## Stack 
- Typescript
- Node v18.17.0
- Express.js (Backend Framework)
- PostgreSQL (SQL Database) 
- Firebase (Authentication)
- Axios (API Fetching)
- Midtrans (Payment Gateway)
- Socket.io (Long Pooling Connection)

## Features
- [x] Firebase Authentication and Authorization
- [x] Payment Gateway Implementation via Midtrans
- [x] Realtime Chat Messaging Features with Socket.io
- [x] CRUD for Media Partner, Sponsorship, and Equipment Rentals  

## Setup 
### Pre-requisite
- Node v18.17.0
- PostgreSQL
### Initial Setup
1. Git clone this project using
```
git clone https://github.com/Eventhings/backend-eventhings
```
2. Install all needed dependencies using
```
npm install
```
or
```
yarn install
```
or
```
pnpm install
```
3. Prepare all credentials needed (GCP, Midtrans, Firebase, and PostgreSQL) like provided on the `.env.example` file, for the GCP service account make sure that the service account have permission to write into Google Cloud Bucket
4. Make sure that your PostgreSQL Database is running
5. Create all tables needed using the query script available on `table.db` file
6. Start the server using 
```
npm run dev
```
or 
```
yarn run dev
```
or
```
pnpm run dev
```
7. Enjoy the RestAPI

## ERD Design
<p align="center">
   <img width="850" src="https://github.com/Eventhings/backend-eventhings/assets/28957554/2a2d6644-0e22-40b5-b58c-c56df295b068">
</p>

## Microservice Diagram
Microservice Diagram Flow of the Backend Service
<p align="center">
   <img width="850" alt="image" src="https://github.com/Eventhings/backend-eventhings/assets/28957554/83f81806-2b4a-4a3d-9314-625b9cdb1b75">
</p>


## Architecture Design on GCP
Google Cloud Platform Architecture Design
<p align="center">
   <img width="850" alt="image" src="https://github.com/Eventhings/backend-eventhings/assets/28957554/fcca8f94-0b22-4538-9b23-bd1ed5c76184">
</p>
