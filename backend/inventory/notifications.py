import requests
import logging

logger = logging.getLogger(__name__)

def send_expo_push_notification(tokens, title, body, data=None):
    """
    Sends push notifications to one or more Expo push tokens.
    tokens: str or list of strings representing Expo Push Tokens.
    """
    if not tokens:
        logger.info("No tokens provided for push notification.")
        return False
    
    # Normalize to list
    if isinstance(tokens, str):
        token_list = [tokens]
    else:
        token_list = list(tokens)
        
    # Clean tokens list and ensure they are valid Expo formats
    token_list = [
        t for t in token_list 
        if t and (t.startswith("ExponentPushToken[") or t.startswith("ExpoPushToken["))
    ]
    
    if not token_list:
        logger.warning("No valid Expo push tokens found in the target list.")
        return False

    url = "https://exp.host/--/api/v2/push/send"
    
    # Build batch payload
    payload = []
    for token in token_list:
        msg = {
            "to": token,
            "title": title,
            "body": body,
            "sound": "default",
        }
        if data:
            msg["data"] = data
        payload.append(msg)
        
    try:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate",
        }
        logger.info(f"Dispatching push notifications: {payload}")
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        # Log response details
        if response.status_code == 200:
            logger.info(f"Push notifications sent successfully. Response: {response.json()}")
            return True
        else:
            logger.error(f"Expo push API returned error status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Failed to communicate with Expo push API: {e}")
        return False
