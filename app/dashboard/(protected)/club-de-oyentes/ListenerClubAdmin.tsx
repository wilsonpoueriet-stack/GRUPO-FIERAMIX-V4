"use client";

import { useEffect, useMemo, useState } from "react";

type Member = {
  key: string;
  name: string;
  whatsapp: string;
  city: string;
  country: string;
  stationId: string;
  stationName: string;
  consentWhatsApp: boolean;
  consentAt: string;
  registeredAt: string;
  updatedAt: string;
  status: string;
};

type ApiResponse = {
  ok?: boolean;
  error