package com.jewelrystore.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MergeCartRequest {

    @NotBlank
    private String guestSessionId;
}
