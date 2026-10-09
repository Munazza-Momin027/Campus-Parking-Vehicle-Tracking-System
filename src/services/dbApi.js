/**
 * CPVTS Client-Side Database API Service
 * Communicates with the SQLite Backend REST API.
 * Ensures instant UI reactivity with reliable server-side persistence.
 */

export async function fetchFullDatabaseState() {
  try {
    const res = await fetch('/api/database/state');
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('[CPVTS DB] Failed to fetch database state, falling back to local storage:', err);
  }
  return null;
}

export async function checkDatabaseStatus() {
  try {
    const res = await fetch('/api/database/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[CPVTS DB] Failed to fetch database status:', err);
  }
  return { connected: false, error: 'Database unreachable' };
}

export async function dbApiAddRegisteredVehicle(vehicle) {
  try {
    const res = await fetch('/api/registered-vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[CPVTS DB] Error adding registered vehicle:', err);
  }
  return null;
}

export async function dbApiUpdateRegisteredVehicle(id, updates) {
  try {
    const res = await fetch(`/api/registered-vehicles/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[CPVTS DB] Error updating registered vehicle:', err);
  }
  return null;
}

export async function dbApiDeleteRegisteredVehicle(id) {
  try {
    const res = await fetch(`/api/registered-vehicles/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[CPVTS DB] Error deleting registered vehicle:', err);
  }
  return null;
}

export async function dbApiToggleRegisteredVehicleStatus(id) {
  try {
    const res = await fetch(`/api/registered-vehicles/${encodeURIComponent(id)}/status`, {
      method: 'PATCH'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[CPVTS DB] Error toggling registered vehicle status:', err);
  }
  return null;
}

export async function dbApiGetNextSlotId(type = 'Four-Wheeler') {
  try {
    const res = await fetch(`/api/parking-slots/next-id?type=${encodeURIComponent(type)}`);
    if (res.ok) {
      const data = await res.json();
      return data.nextId;
    }
  } catch (err) {
    console.error('[CPVTS DB] Error computing next slot ID:', err);
  }
  return type.toLowerCase().includes('two') ? 'T-11' : 'F-06';
}

export async function dbApiCreateParkingSlot(slotData) {
  try {
    const res = await fetch('/api/parking-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slotData)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[CPVTS DB] Error creating parking slot:', err);
    return { success: false, error: err.message };
  }
}

export async function dbApiUpdateParkingSlot(slotId, slotData) {
  try {
    const res = await fetch(`/api/parking-slots/${encodeURIComponent(slotId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slotData)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[CPVTS DB] Error updating slot:', err);
    return { success: false, error: err.message };
  }
}

export async function dbApiToggleParkingSlotStatus(slotId) {
  try {
    const res = await fetch(`/api/parking-slots/${encodeURIComponent(slotId)}/status`, {
      method: 'PATCH'
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[CPVTS DB] Error toggling slot status:', err);
    return { success: false, error: err.message };
  }
}

export async function dbApiDeleteParkingSlot(slotId) {
  try {
    const res = await fetch(`/api/parking-slots/${encodeURIComponent(slotId)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[CPVTS DB] Error deleting parking slot:', err);
    return { success: false, error: err.message };
  }
}

export async function dbApiUpdateSlot(slotId, slotData) {
  return dbApiUpdateParkingSlot(slotId, slotData);
}

export async function dbApiCheckIn(payload) {
  try {
    const res = await fetch('/api/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[CPVTS DB] Error recording check-in in database:', err);
  }
  return null;
}

export async function dbApiCheckOut(payload) {
  try {
    const res = await fetch('/api/check-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[CPVTS DB] Error recording check-out in database:', err);
  }
  return null;
}

export async function dbApiSaveSettings(settings) {
  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[CPVTS DB] Error saving settings in database:', err);
  }
  return null;
}

export async function dbApiSaveCamera(camera) {
  try {
    const res = await fetch('/api/camera-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(camera)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[CPVTS DB] Error saving camera in database:', err);
  }
  return null;
}

export async function dbApiResetDatabase() {
  try {
    const res = await fetch('/api/database/reset', {
      method: 'POST'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[CPVTS DB] Error resetting database:', err);
  }
  return null;
}

// =========================================================================
// VIP & EMERGENCY RESERVATIONS API
// =========================================================================

export async function dbApiGetVipReservations(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.slotId) params.append('slotId', filters.slotId);
    if (filters.type) params.append('type', filters.type);
    if (filters.vehicleNumber) params.append('vehicleNumber', filters.vehicleNumber);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/vip-reservations${query}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[CPVTS DB] Error fetching VIP reservations:', err);
  }
  return null;
}

export async function dbApiCreateVipReservation(reservationData, userRole = 'Security', userName = 'Officer Raj Sharma') {
  try {
    const res = await fetch('/api/vip-reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': userRole,
        'X-User-Name': userName
      },
      body: JSON.stringify({ ...reservationData, userRole, userName })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return data;
    }
    return { success: false, error: data.error || 'Failed to create reservation', status: res.status };
  } catch (err) {
    console.error('[CPVTS DB] Error creating VIP reservation:', err);
    return { success: false, error: err.message };
  }
}

export async function dbApiReleaseVipReservation(id, userRole = 'Security', userNameOrOptions = 'Officer Raj Sharma', releaseNotes = '') {
  let effectiveUserName = 'Officer Raj Sharma';
  let effectiveNotes = typeof releaseNotes === 'string' ? releaseNotes : '';

  if (typeof userNameOrOptions === 'string') {
    effectiveUserName = userNameOrOptions;
  } else if (typeof userNameOrOptions === 'object' && userNameOrOptions !== null) {
    effectiveUserName = userNameOrOptions.releasedBy || userNameOrOptions.userName || 'Officer Raj Sharma';
    effectiveNotes = userNameOrOptions.reason || userNameOrOptions.releaseNotes || effectiveNotes || '';
  }

  try {
    const res = await fetch(`/api/vip-reservations/${encodeURIComponent(id)}/release`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': String(userRole || 'Security'),
        'X-User-Name': String(effectiveUserName || 'Officer Raj Sharma')
      },
      body: JSON.stringify({
        userRole: String(userRole || 'Security'),
        userName: String(effectiveUserName || 'Officer Raj Sharma'),
        releaseNotes: effectiveNotes,
        reason: effectiveNotes
      })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return data;
    }
    return { success: false, error: data.error || 'Failed to release reservation', status: res.status, data };
  } catch (err) {
    console.error('[CPVTS DB] Error releasing VIP reservation:', err);
    return { success: false, error: err.message };
  }
}

export async function dbApiUpdateVipReservationStatus(id, status, userRole = 'Security', userName = 'Officer Raj Sharma') {
  try {
    const res = await fetch(`/api/vip-reservations/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': userRole,
        'X-User-Name': userName
      },
      body: JSON.stringify({ status, userRole, userName })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return data;
    }
    return { success: false, error: data.error || 'Failed to update reservation status', status: res.status };
  } catch (err) {
    console.error('[CPVTS DB] Error updating VIP reservation status:', err);
    return { success: false, error: err.message };
  }
}
